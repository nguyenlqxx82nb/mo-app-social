import { IAssignmentItemTag } from 'api';

export interface IFilterFeatureAssign {
    assign_type: number; // 2: tin nhắn; 3: bài viết; 4: đánh giá
    assignee: string; // id của nhân viên được lọc; nếu trường hợp lọc tất cả sẽ không gửi lên
    status: string; // 1: chưa hoàn tất; 2 đã hoàn tất; -1: bị thu hồi frontend
    classify: Array<number>; // sử dụng cho lọc trạng thái phản hồi 0: tiêu cực; 1: trung lập; 2: tích cực
    tags: Array<IAssignmentItemTag>; // danh sách tag phân loại công việc
    reply_status: Array<number>; // trạng thái trả lời
    sort_field: string;
    sort_type: string;
    user_social_ids: string; // gửi lên khi muốn search một user social cụ thể
    message: string; // gửi lên khi muốn search nội dung tin nhắn của tất cả assign
    page_social_ids?: Array<string>;
}
