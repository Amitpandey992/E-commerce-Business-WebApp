declare module "razorpay" {
    // Minimal typings to satisfy usage in config
    export default class Razorpay {
        constructor(options: { key_id: string; key_secret: string });
        orders: {
            create(params: {
                amount: number;
                currency: string;
                receipt?: string;
                notes?: string | any;
            }): Promise<{ id: string; amount: number; currency: string }>;
        };
        payments: {
            fetch(payment_id: string): Promise<{
                status: string;
                status_reason_code?: string;
                [key: string]: any;
            }>;
        };
    }
}
