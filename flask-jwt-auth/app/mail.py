import smtplib
from email.mime.text import MIMEText

def send_confirmation_email(receiver_email):
    sender_email = "freeapiacc97@gmail.com"
    password = "wijy eadx meep fxly"

    msg = MIMEText("Hello! This is a confirmation email that you have successfully created an account in AI-Powered Stock Screener and Advisory platform.")
    msg['Subject'] = "Successful Account Creation"
    msg['From'] = sender_email
    msg['To'] = receiver_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        print("Email sent successfully!")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
