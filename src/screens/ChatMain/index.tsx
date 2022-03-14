import React from 'react';
import { View, DeviceEventEmitter, ActivityIndicator } from 'react-native';
import { WrapButton } from 'mo-app-comp';
import { Color, Constants, SocialService } from 'mo-app-common';
import SocialChatListMainScreen from './List';
import { ITabSocial } from 'api/TabSocial';
import { IFeatureAssign } from 'api/FeatureAssign';

export default class SocialChatMainScreen extends React.PureComponent<{ tab?: ITabSocial }, any> {
	private timeIntervalCallTabCount: any;
	// private socketSubscription: EmitterSubscription;

	chatListTabHeader: Array<IFeatureAssign>;
	constructor(props: { tab: ITabSocial }) {
		super(props);
		this.state = {
			loading: true,
			currentTabIndex: 0
		};

		const tab = this.props.tab;
		this.chatListTabHeader = tab.features;

	}

	componentDidMount() {
		// this.socketSubscription && this.socketSubscription.remove();
		DeviceEventEmitter.addListener(Constants.EmitCode.SOCIAL_NOTIFICATION, this.handleSocket);
		this.startLoadCountTab();
		setTimeout(() => {
			this.setState({ loading: false });
		}, 1000);
	}

	componentWillUnmount() {
		// this.socketSubscription && this.socketSubscription.remove();
		this.timeIntervalCallTabCount && clearInterval(this.timeIntervalCallTabCount);
	}

	private handleSocket = (event) => {
		const { tab } = this.props;
		if (!tab || !tab.features || !tab.features.length || !event || !event.body || (event.body.social_type && event.body.social_type.toString() !== `${tab.social_type}`)) {
			return;
		}
		const body = event.body;
		const socketType = body.socket_type;
		const featureCodeOfSocket = SocialService.getFeatureTypeBySocialTypeSocket(socketType);
		const feature = tab.features.find(item => item.code === featureCodeOfSocket);
		if (!feature || !Constants.SOCIAL.SOCKET_RECALL_TAB_COUNT.find(socket => socket === socketType)) {
			return;
		}
		feature.isReCallTabCount = true;
	}

	onTabPressHandler = (index: number) => {
		const { currentTabIndex } = this.state;
		if (currentTabIndex === index) {
			return;
		}
		this.setState({
			currentTabIndex: index
		});
	}

	async startLoadCountTab() {
		const tab = this.props.tab;
		if (!tab || tab.loadedCongigPage) {
			return;
		}
		if (!this.chatListTabHeader || !this.chatListTabHeader.length) {
			return;
		}
		this.chatListTabHeader.forEach(feature => {
			if (feature.ignoreCount) {
				return;
			}
			feature.isCallTabCount = false;
			feature.isReCallTabCount = false;
			this.getTabCount(feature);
			this.timeIntervalCallTabCount = setInterval(() => {
				if (!feature.isCallTabCount && feature.isReCallTabCount) {
					feature.isReCallTabCount = false;
					this.getTabCount(feature);
				}
			}, 2000);
		});
	}

	getTabCount(feature: IFeatureAssign) {
		if (feature.isCallTabCount) {
			return;
		}
		feature.isCallTabCount = true;
		let page_social_ids = '';
		if (!feature.tabOrigin || !feature.tabOrigin.pages || !feature.tabOrigin.pages.length) {
			return;
		}
		const page = feature.tabOrigin.pages[0];
		const isAdmin = page.currentStaff && page.currentStaff.isAdmin;
		const reAssignTime = page.reAssignTime;
		page_social_ids = feature.filter.page_social_ids.join(',') || feature.tabOrigin.pages.map(item => item.page_social_id).join(',');
		SocialService.getSummary(feature.tabOrigin.social_type, undefined, feature.specific_key_get_count, feature.filter.assignee, isAdmin, reAssignTime, Constants.SOCIAL.RANGE_TIME_REVOKE_BEFORE, page_social_ids).then(result => {
			feature.isCallTabCount = false;
			if (!result || !result.code || result.code !== '001') {
				return;
			}
			feature.badgeNumber = result.data || 0;
			this.forceUpdate();
		}, _ => {
			feature.isCallTabCount = false;
		});
	}

	render() {
		const { loading, currentTabIndex } = this.state;

		if (loading) {
			return (
				<View style={{ flex: 1, backgroundColor: Color.background }}>
					<View style={{flexGrow:1, justifyContent:'center', alignItems:'center'}}>
            <ActivityIndicator
                  size={'large'}
                  color={Color.primary}
                  style={[
                    { borderRadius: 20 },
                  ]} />
          </View>
				</View>
			);
		}
		return (
			<View style={{ backgroundColor: Color.background, flex: 1 }} >
				<View style={{ paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: Color.border, flexDirection: 'row' }}>
					{
						this.chatListTabHeader.map((item: IFeatureAssign, index: number) => {
							return (
								<WrapButton
									key={`header_${index}`}
									text={item.name}
									size={'ms'}
									width={'auto'}
									type={'border'}
									active={currentTabIndex === index ? true : false}
									badgeNumber={item.badgeNumber}
									hasBadge={true}
									onPress={this.onTabPressHandler.bind(this, index)}
									containerStyle={{ marginRight: 23 }}
								/>
							);
						})
					}
				</View>
				<View style={{flexGrow: 1 }}>
					<View style={{ flex: 1 }}>
						{
							this.chatListTabHeader.map((item: IFeatureAssign, index: number) => {
								const _containerStyle = (index === currentTabIndex) ? { zIndex: 1 } : { zIndex: 0 };
								if (index === currentTabIndex) {
									item.contentLoaded = true;
								}
								if (item.contentLoaded) {
									return (
										<SocialChatListMainScreen key={`content_${index}`} containerStyle={_containerStyle} feature={item} />
									);
								}
								return null;
							})
						}
					</View>
				</View>
			</View>
		);
	}

}
