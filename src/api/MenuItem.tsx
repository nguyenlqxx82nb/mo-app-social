export interface IMenuItem {
	icon: string;
	name: string;
	isDisable?: boolean;
	isIgnore?: boolean;
	socialTypes?: number[]; // Dùng với những trường hợp hiển thị đặc biệt dành riêng cho từng MXH
	featureCodes?: number[]; // Dùng với những trường hợp hiển thị đặc biệt dành riêng cho từng MXH
	onSelect: () => void;
}
