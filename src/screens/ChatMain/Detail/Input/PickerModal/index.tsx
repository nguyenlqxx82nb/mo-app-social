import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { WrapModal, WrapText, ButtonRipple, ImagePickerScreen, Router } from 'mo-app-comp';
import { Styles, CustomIcon, Color } from 'mo-app-common';
import styles from './styles';
const RNFS = require('react-native-fs');

export interface IAttachment {
	name?: string;
	type?: string;
	originType?: string;
	uri?: string;
	duration?: number;
	fileSize?: number;
}
export interface IPickerFileModalProps {
	selectSingleItem?: boolean;
	typeUploads?: string[]; // image, video, file
	onImageSelected: (attachments: IAttachment[]) => void
}
class PickerFileModal extends React.PureComponent<IPickerFileModalProps, any> {
	static defaultProps = {
		typeUploads: ['image', 'file', 'video'],
		selectSingleItem: false
	}

	modalRef: WrapModal;
	constructor(props: any) {
		super(props);
	}

	onPressImageHandler = () => {
		const { selectSingleItem } = this.props;
		Router.push(<ImagePickerScreen selectSingleItem={selectSingleItem} onSelectImages={this.onSelectImagesHandler} cropping={false} />);
		this.modalRef.close();
	}

	onSelectImagesHandler = async (images: IAttachment[]) => {
		if (Platform.OS === 'ios') {
			for (const image of images) {
				if (image.type.toLowerCase() !== 'video') {
					continue;
				}
				const fileNameLength = image.name.length;
				const ext = image.name.substring(fileNameLength - 3);
				const encodedUri = encodeURI(image.uri);
				const destPath = `${RNFS.TemporaryDirectoryPath}${Math.random().toString(36).substring(7)}.${ext}`;
				image.uri = await RNFS.copyAssetsVideoIOS(encodedUri, destPath);
			}
		}
		const { onImageSelected } = this.props;
		onImageSelected && onImageSelected(images);
	}

	onPressFileHandler = async () => {
		// Pick multiple files
		const { onImageSelected } = this.props;
		try {
			const results = await DocumentPicker.pickMultiple({
				type: [DocumentPicker.types.allFiles],
			});
			onImageSelected && onImageSelected(results);
		} catch (err) {
			if (DocumentPicker.isCancel(err)) {
				// User cancelled the picker, exit any dialogs or menus and move on
			} else {
				throw err;
			}
		}
		this.modalRef.close();
	}

	onClosePressHandler = () => {
		this.modalRef.close();
	}

	render() {
		const { typeUploads } = this.props;
		if (!typeUploads) {
			return null;
		}
		return (
			<WrapModal
				ref={(comp: any) => { this.modalRef = comp; }}
				autoOpen={true}
				overlayOpacity={0.65}
				position={'bottom'}>
				<View style={[styles.container]}>
					<View style={[Styles.RowCenter, Styles.JustifyBetween]}>
						<WrapText st={[Styles.Text_L_M]}>{'Chọn media cần tải lên'}</WrapText>
						<ButtonRipple name={'close'} size={14} color={Color.text}
								onPress={this.onClosePressHandler} />
					</View>
					{
						(!!typeUploads.includes('image') || !!typeUploads.includes('video')) &&
						<TouchableOpacity
							key={'1'}
							onPress={this.onPressImageHandler}
							style={[Styles.RowCenter, { paddingVertical: 10, paddingTop: 20 }]}>
							<View style={[Styles.RowCenter]}>
								<CustomIcon name={'media_photo'} size={20} color={Color.primary} />
								<WrapText st={[Styles.Text_M_R, { marginLeft: 10 }]}>{'Ảnh và video'}</WrapText>
							</View>
						</TouchableOpacity>
					}
					{
						!!typeUploads.includes('file') &&
						<TouchableOpacity
							key={'2'}
							onPress={this.onPressFileHandler}
							style={[Styles.RowCenter, { paddingVertical: 10 }]}>
							<View style={[Styles.RowCenter]}>
								<CustomIcon name={'media_file'} size={20} color={Color.primary} />
								<WrapText st={[Styles.Text_M_R, { marginLeft: 10 }]}>{'File'}</WrapText>
							</View>
						</TouchableOpacity>
					}
				</View>
			</WrapModal>
		);
	}

}

export default PickerFileModal;
