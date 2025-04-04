from fastapi import HTTPException
from app.core.config import get_settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import json
import requests

settings = get_settings()

logger = logging.getLogger(__name__)

class FreeNotificationService:
    @staticmethod
    async def send_email(email: str, recovery_code: str):
        """
        Envia um email usando Gmail SMTP
        """
        try:
            # Configurações do email
            sender_email = settings.GMAIL_EMAIL
            sender_password = settings.GMAIL_APP_PASSWORD
            subject = "Código de Recuperação de Senha - Funntour"
            
            # Criar mensagem
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = email
            msg['Subject'] = subject
            
            # Corpo do email em HTML
            body = f"""
            <html>
                <body>
                    <h2>Código de Recuperação de Senha</h2>
                    <p>Olá,</p>
                    <p>Você solicitou a recuperação de senha para sua conta na Funntour.</p>
                    <p>Seu código de recuperação é: <strong>{recovery_code}</strong></p>
                    <p>Este código expira em 30 minutos.</p>
                    <p>Atenciosamente,</p>
                    <p>Equipe Funntour</p>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Enviar email usando Gmail SMTP
            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)
            
            logger.info(f"Email enviado com sucesso para {email}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao enviar email: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao enviar email: {str(e)}"
            )

    @staticmethod
    async def send_whatsapp(phone: str, recovery_code: str):
        """
        Envia uma mensagem WhatsApp usando WhatsApp Cloud API
        """
        try:
            if not phone:
                return False
                
            # Formatar o número de telefone
            phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            if not phone.startswith("+55"):
                phone = "+55" + phone
            
            # Configurações do WhatsApp Cloud API
            url = f"https://graph.facebook.com/v17.0/{settings.WHATSAPP_CLOUD_API_ID}/messages"
            headers = {
                "Authorization": f"Bearer {settings.WHATSAPP_CLOUD_API_TOKEN}",
                "Content-Type": "application/json"
            }
            
            # Mensagem
            message = f"""
            Olá,
            
            Você solicitou a recuperação de senha para sua conta na Funntour.
            Seu código de recuperação é: {recovery_code}
            
            Este código expira em 30 minutos.
            
            Atenciosamente,
            Equipe Funntour
            """
            
            # Dados da requisição
            data = {
                "messaging_product": "whatsapp",
                "to": phone,
                "type": "text",
                "text": {
                    "body": message
                }
            }
            
            # Enviar mensagem
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                logger.info(f"WhatsApp enviado com sucesso para {phone}")
                return True
            else:
                logger.error(f"Erro ao enviar WhatsApp: {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail="Erro ao enviar WhatsApp"
                )
            
        except Exception as e:
            logger.error(f"Erro ao enviar WhatsApp: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao enviar WhatsApp: {str(e)}"
            )

free_notification_service = FreeNotificationService()
