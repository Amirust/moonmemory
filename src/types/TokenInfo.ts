import { IDiscordBillingSource, IDiscordUser } from './DiscordInterfaces.js';

interface TokenInfo {
    is_discord_token: boolean;
    is_valid?: boolean;
    token: string;
    type: TokenType;
    user_id?: string;
    user?: IDiscordUser;
    billing?: IDiscordBillingSource[];
}

enum TokenType {
    default = 0,
    mfa = 1,
    notDiscord = 2
}

export {
	TokenInfo,
	TokenType
};