import { IFeatureAssign } from 'api/FeatureAssign';
import { IPageAssign } from 'Api/PageAssign';
import { ITabSocial } from 'api/TabSocial';
import { Constants, } from 'mo-app-common';
import { GET_DEFAULT_FILTER } from 'mo-app-common/src/Services/Social/SocialService';
import React from 'react';
import SocialChatMainScreen from '../screens/ChatMain';

export const TAB_SOCIAL_DEFAULT = (pages: Array<IPageAssign>, keyGetCount: string, onRecallTabCount?: any): Array<ITabSocial> => {
  const tabs: Array<ITabSocial> = [
    {
      name: 'Facebook',
      width: 110,
      content: <SocialChatMainScreen />,
      social_type: Constants.SOCIAL.TYPE.FACEBOOK,
      pages: [],
      features: [],
    },
    {
      name: 'Instagram',
      width: 110,
      content: <SocialChatMainScreen />,
      social_type: Constants.SOCIAL.TYPE.INSTAGRAM,
      pages: [],
      features: [],
    },
    {
      name: 'Zalo',
      width: 90,
      content: <SocialChatMainScreen />,
      social_type: Constants.SOCIAL.TYPE.ZALO,
      pages: [],
      features: [],
    },
    {
      name: 'LINE',
      width: 90,
      content: <SocialChatMainScreen />,
      social_type: Constants.SOCIAL.TYPE.LINE,
      pages: [],
      features: [],
    },
    {
      name: 'Youtube',
      width: 90,
      content: <SocialChatMainScreen />,
      social_type: Constants.SOCIAL.TYPE.YOUTUBE,
      pages: [],
      features: [],
    },
    {
      name: 'Web live chat',
      width: 130,
      content: <SocialChatMainScreen />,
      social_type: Constants.SOCIAL.TYPE.WEB_LIVE_CHAT,
      pages: [],
      features: [],
    }
  ];

  tabs.forEach(tab => {
    tab.pages = pages.filter(page => page.social_type === tab.social_type);
    tab.features = GET_DEFAULT_FEATUES_BY_TAB(tab, keyGetCount);
    tab.content = <SocialChatMainScreen tab={tab} />;
    tab.onRecallTabCount = onRecallTabCount;
  });
  return tabs.filter(tab=>tab.pages.length);
};

export const GET_DEFAULT_FEATUES_BY_TAB = (tab: ITabSocial, keyGetCount: string = 'unreply'): Array<IFeatureAssign> => {
  const features: Array<IFeatureAssign> = [{
    tabOrigin: tab,
    name: 'Tin nhắn',
    width: 65,
    badgeNumber: 0,
    code: Constants.SOCIAL.FEATURE_CODE.MESSAGE,
    filter: GET_DEFAULT_FILTER(Constants.SOCIAL.FEATURE_CODE.MESSAGE),
    // socialTypeAccept: [],
    socialTypeAccept: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.LINE, Constants.SOCIAL.TYPE.ZALO, Constants.SOCIAL.TYPE.WEB_LIVE_CHAT],
    specific_key_get_count: `total_${keyGetCount}_conversation_assign`,
    specific_show_status_send_data_assignment: true,
    specific_object_type: Constants.SOCIAL.FEATURE_CODE.MESSAGE,
  },
  {
    tabOrigin: tab,
    name: 'Bình luận',
    width: 70,
    badgeNumber: 0,
    code: Constants.SOCIAL.FEATURE_CODE.COMMENT,
    filter: GET_DEFAULT_FILTER(Constants.SOCIAL.FEATURE_CODE.COMMENT),
    socialTypeAccept: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.INSTAGRAM, Constants.SOCIAL.TYPE.YOUTUBE],
    // socialTypeAccept: [],
    specific_key_get_count: `total_${keyGetCount}_comment_assign`,
    specific_show_status_send_data_assignment: false,
    specific_object_type: Constants.SOCIAL.FEATURE_CODE.COMMENT,
  },
  {
    tabOrigin: tab,
    name: 'Đánh giá',
    width: 70,
    badgeNumber: 0,
    code: Constants.SOCIAL.FEATURE_CODE.RATE,
    filter: GET_DEFAULT_FILTER(Constants.SOCIAL.FEATURE_CODE.RATE),
    socialTypeAccept: [],
    // socialTypeAccept: [Constants.SOCIAL.TYPE.FACEBOOK],
    specific_key_get_count: `total_${keyGetCount}_rating_assign`,
    specific_show_status_send_data_assignment: false,
    specific_object_type: Constants.SOCIAL.FEATURE_CODE.RATE,
  }
];

  return features.filter(feature => feature.socialTypeAccept.find(socialType => socialType === tab.social_type));
};
