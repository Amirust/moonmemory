import fetch from 'node-fetch';
import { Proxy, ProxyProvider, ProxyType } from '@MoonMemory/types/Proxy.js';

type MullvadResponse = {
    hostname: string;
    country_code: string;
    country_name: string;
    city_name: string;
    city_code: string;
    active: boolean;
    owned: boolean;
    provider: string;
    ipv4_addr_in: string;
    ipv6_addr_in: string;
    network_port_speed: number;
    stboot: boolean;
    type: 'openvpn' | 'wireguard';
    pubkey?: string;
    multihop_port?: number;
    socks_name?: string;
    socks_port?: number;

}
export default class MullvadProxyProvider implements ProxyProvider
{
	name = 'Mullvad (Только при использовании WireGuard)';
	proxies: Proxy[] = [];

	async load(): Promise<Proxy[]>
	{
		const rawProxy: MullvadResponse[] = await ( await fetch( 'https://api.mullvad.net/www/relays/all/' ) ).json() as MullvadResponse[];
		const proxies: Proxy[] = rawProxy
			.filter( proxy => proxy.active && proxy.socks_name )
			.map( proxy => ( {
				url: `${proxy.socks_name}:${proxy.socks_port}`,
				type: ProxyType.SOCKS5,
				valid: true,
				uses: []
			} ) );

		this.proxies = proxies;
		return proxies;
	}

	remove( proxy: Proxy ): void
	{
		this.proxies = this.proxies.filter( p => p.url !== proxy.url );
	}
}