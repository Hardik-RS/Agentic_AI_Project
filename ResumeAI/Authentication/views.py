import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import PasswordResetRequest
from .serializers import (
    ChangePasswordSerializer,
    PasswordResetCompleteSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
    RegisterSerializer,
)


class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "date_joined": request.user.date_joined,
            }
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"message": "Password changed successfully."})


class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"].strip()
        email = serializer.validated_data["email"].strip().lower()
        user_model = get_user_model()
        user = user_model.objects.filter(username__iexact=username).first()

        if user is None:
            return Response(
                {"message": "No account was found with that username."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.email.casefold() != email:
            return Response(
                {"message": "Username and registered email do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = f"{secrets.randbelow(1_000_000):06d}"
        PasswordResetRequest.objects.filter(
            email=email,
            used=False,
        ).update(used=True)
        PasswordResetRequest.objects.create(
            email=email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        send_mail(
            "Your ResumeAI password reset code",
            f"Your password reset OTP is {otp}. It expires in 10 minutes.",
            None,
            [user.email],
            fail_silently=False,
        )

        return Response(
            {"message": "An OTP has been sent to your registered email address."},
            status=status.HTTP_200_OK,
        )


class PasswordResetVerifyView(APIView):
    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        reset_request = PasswordResetRequest.objects.filter(
            email=email,
            used=False,
        ).first()

        if (
            reset_request is None
            or reset_request.expires_at <= timezone.now()
            or reset_request.attempts >= 5
            or not check_password(serializer.validated_data["otp"], reset_request.otp_hash)
        ):
            if reset_request is not None:
                reset_request.attempts += 1
                reset_request.save(update_fields=["attempts"])
            return Response(
                {"message": "The OTP is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reset_token = secrets.token_urlsafe(32)
        reset_request.reset_token_hash = make_password(reset_token)
        reset_request.verified_at = timezone.now()
        reset_request.save(update_fields=["reset_token_hash", "verified_at"])
        return Response({"reset_token": reset_token})


class PasswordResetCompleteView(APIView):
    def post(self, request):
        serializer = PasswordResetCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        reset_request = PasswordResetRequest.objects.filter(
            email=email,
            used=False,
            verified_at__isnull=False,
        ).first()
        user_model = get_user_model()

        if (
            reset_request is None
            or reset_request.expires_at <= timezone.now()
            or not check_password(
                serializer.validated_data["reset_token"],
                reset_request.reset_token_hash,
            )
        ):
            return Response(
                {"message": "The password reset session is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = user_model.objects.filter(email__iexact=email).first()
        if user is None:
            return Response(
                {"message": "The password reset session is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        reset_request.used = True
        reset_request.save(update_fields=["used"])
        return Response({"message": "Password reset successfully."})
