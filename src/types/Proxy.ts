import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

enum ProxyType {
    HTTP,
    HTTPS,
    SOCKS4,
    SOCKS5
}

interface ProxyUse {
    date: Date;
    success: boolean;
    status: number;
}

interface Proxy {
    url: string;
    type: ProxyType;
    valid: boolean;
    uses: ProxyUse[];
}

interface ProxyProvider {
    name: string;
    proxies: Proxy[];
    load(): Promise<Proxy[]>;
    remove( proxy: Proxy ): void;
}

interface ProxyAgentPair {
    proxy: Proxy;
    agent: SocksProxyAgent | HttpsProxyAgent;
}

export {
	ProxyType,
	Proxy,
	ProxyUse,
	ProxyProvider,
	ProxyAgentPair
};