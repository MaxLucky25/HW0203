import nodemailer from 'nodemailer';
import config from "../utility/ config";


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
    },
});

export const emailService = {
    async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
        try {
            await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text, html });
            return true;
        } catch (error) {
            console.error("Error sending email:", error);
            return false;
        }
    },

    async sendRegistrationEmail(email: string, confirmationCode: string): Promise<boolean> {
        const subject = "Подтверждение регистрации";
        const text = `Ваш код подтверждения: ${confirmationCode}`;
        const html = `<p>Ваш код подтверждения: <b>${confirmationCode}</b></p>`;
        return await this.sendEmail(email, subject, text, html);
    }
};