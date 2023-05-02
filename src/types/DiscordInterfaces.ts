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

interface IDiscordDMChannel {
    id: string;
    type: number;
    last_message_id: string;
    flags: number;
    recipients: IDiscordUser[];
}

interface IDiscordMessage {
    id: string;
    type: number;
    content: string;
    channel_id: string;
    author: IDiscordUser;
    attachments: any[];
    embeds: any[];
    mentions: any[];
    mention_roles: any[];
    pinned: boolean;
    mention_everyone: boolean;
    tts: boolean;
    timestamp: string;
    edited_timestamp: string;
    flags: number;
    components: any[];
}

export {
	IDiscordUser,
	IDiscordBillingSource,
	IDiscordDMChannel,
	IDiscordMessage
};