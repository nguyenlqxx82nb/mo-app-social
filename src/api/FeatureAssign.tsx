import { IAssignmentItem } from './AssignmentItem';
import { IFilterFeatureAssign } from './FilterFeatureAssign';
import { ITabSocial } from './TabSocial';

export interface IFeatureAssign {
    tabOrigin: ITabSocial,
    name: string,
    badgeNumber?: number;
    width?: number;
    code: number;
    acceptLoadData?: boolean;
    itemSelected?: IAssignmentItem;
    filter: IFilterFeatureAssign;
    isFilterAll?: boolean;
    socialTypeAccept: Array<number>;
    contentLoaded?: boolean;
    ignoreCount?: boolean;
    ignoreRevoke?: boolean;
    isCallTabCount?: boolean;
    isReCallTabCount?: boolean;
    specific_is_filter_all_staff?: boolean;
    specific_key_get_count?: string;
    specific_show_status_send_data_assignment: boolean;
    specific_on_filter?: (isBackGroundFetchData?: boolean) => void;
    specific_sort_assignments?: (scrollToItem?: IAssignmentItem) => void;
    specific_load_data_status?: string;
    specific_object_type?: number;
    specific_filter_search_type?: string;
    specific_filter_search_value?: string;
    specific_filter_loaded_cache?: boolean; // Đánh dấu đã tải cache
}
