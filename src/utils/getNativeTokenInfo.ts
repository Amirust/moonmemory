import { TokenInfo, TokenType } from '@MoonMemory/types/TokenInfo.js';

export function getNativeTokenInfo( token: string ): TokenInfo 
{
	let is_discord_token: boolean = false;
	let user_id: string | undefined = undefined;
	let type: TokenType;

	if ( token.startsWith( 'mfa.' ) )
	{
		is_discord_token = true;
		type = TokenType.mfa;
	}
	else if ( /\d{16,18}/.test( Buffer.from( token.split( '.' )[0], 'base64' ).toString() ) )
	{
		is_discord_token = true;
		user_id = Buffer.from( token.split( '.' )[0], 'base64' ).toString();
		type = TokenType.default;
	}
	else type = TokenType.notDiscord;

	return {
		is_discord_token,
		user_id,
		type,
		token,
		billing: undefined,
		is_valid: undefined,
		user: undefined
	};

}