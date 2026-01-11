// Dùng để trả dữ liệu ra front-end

export class UserReviewResponseDto {
  id: number;
  rating: number;
  comment: string;
  createdAt: Date;

  reviewer: {
    id: number;
    fullName: string;
    avatarUrl: string;
  };
}
