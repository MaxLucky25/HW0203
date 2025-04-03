import nodemailer from 'nodemailer';
import config from "../utility/config";

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
            console.log(`Попытка отправки письма на ${to} с темой "${subject}"`);
            await transporter.sendMail({ from: config.EMAIL_USER, to, subject, text, html });
            console.log(`Письмо успешно отправлено на ${to}`);
            return true;
        } catch (error) {
            console.error("Ошибка при отправке письма:", error);
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
