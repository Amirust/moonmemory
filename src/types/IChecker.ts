enum toCheck {
    valid,
    billing,
    is_spammed
}

const checks = [{
	name: 'Валидность',
	value: toCheck.valid,
	checked: true,
}, {
	name: 'Биллинг (Карты, пейпал и т.д)',
	value: toCheck.billing,
}, {
	name: 'Проспамлен ли аккаунт',
	value: toCheck.is_spammed
}];

interface defaultParams {
    loader: string;
    proxyProvider: string;
    source: string;
	exporter: string;
    checks: toCheck[];
}

interface PaymentMethod {
	brand: string;
	country: string;
	last_4: string;
	expire_month: number;
	expire_year: number;
}

interface ThreadChannelMessage {
	id: number;
	resolved: number;
}

interface ThreadResult {
	id: number;
	errors: number;
	invalids: number;
	tokensValid: string[];
	tokensBilling: TokenBilling[];
	tokensPhones: string[];
	tokensSpammed: string[];
}

interface ResultToExport {
	tokensValid: string[];
	tokensBilling: TokenBilling[];
	tokensPhones: string[];
	tokensSpammed: string[];
}

interface TokenBilling {
	token: string;
	payments: PaymentMethod[];
}

export {
	toCheck,
	checks,
	defaultParams,
	PaymentMethod,
	ThreadChannelMessage,
	ThreadResult,
	ResultToExport,
	TokenBilling
};