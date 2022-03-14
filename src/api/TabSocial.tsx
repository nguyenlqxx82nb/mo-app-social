import { ITabInfo } from 'mo-app-comp';
import { IFeatureAssign } from './FeatureAssign';
import { IPageAssign } from './PageAssign';

export interface ITabSocial extends ITabInfo {
    social_type?: number;
    pages?: Array<IPageAssign>;
    features: Array<IFeatureAssign>;
    isSelected?: boolean;
    loadedCongigPage?: boolean;
    isNeedReloadData?: boolean;
    onRecallTabCount?: any;
}
