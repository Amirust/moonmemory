interface IDiscordUser {
    id: string;
    username: string;
    discriminator: string;
    flags: number;
    premium_type: number;
    public_flags: number;
    email: string;
    verified: boolean;
    phone?: string;
}

interface IDiscordBillingSource {
    id: string;
    type: number;
    brand: string;
    last_4: string;
    expires_month: number;
    expires_year: number;
    billing_address: {
        name: string;
        line_1: string;
        line_2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    }
}

export {
	IDiscordUser,
	IDiscordBillingSource
};