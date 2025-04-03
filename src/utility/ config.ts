interface IConfig {
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    EMAIL_USER: string;
    EMAIL_PASS: string;
}

const config: IConfig = {
    JWT_SECRET: process.env.JWT_SECRET || "default_secret",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
    EMAIL_USER: process.env.EMAIL_USER || "your-email@gmail.com",
    EMAIL_PASS: process.env.EMAIL_PASS || "your-password",
};

export default config;