'use client';

import StarRating from '@/components/StarRating';
import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Star, Home, User } from 'lucide-react';

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: {
    id: number;
    fullName: string;
    avatarUrl?: string | null;
  };
};

type RoomReview = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  renter: {
    id: number;
    fullName: string;
    avatarUrl?: string | null;
  };
};

type Props = {
  currentUser: any;
  hostId: number;
  roomId: number;
  // Host review props
  myReview: Review | null;
  myRating: number;
  setMyRating: (v: number) => void;
  myComment: string;
  setMyComment: (v: string) => void;
  isSubmittingReview: boolean;
  reviews: Review[];
  onSubmitReview: () => void;
  onUpdateReview: (reviewId: number) => void;
  // Room review props
  roomReviews: RoomReview[];
  myRoomReview: RoomReview | null;
  myRoomRating: number;
  setMyRoomRating: (v: number) => void;
  myRoomComment: string;
  setMyRoomComment: (v: string) => void;
  isSubmittingRoomReview: boolean;
  onSubmitRoomReview: () => void;
  onUpdateRoomReview: (reviewId: number) => void;
  hasConfirmedBooking?: boolean;
};

export default function ReviewSection({
  currentUser,
  hostId,
  roomId,
  // Host review
  myReview,
  myRating,
  setMyRating,
  myComment,
  setMyComment,
  isSubmittingReview,
  reviews,
  onSubmitReview,
  onUpdateReview,
  // Room review
  roomReviews,
  myRoomReview,
  myRoomRating,
  setMyRoomRating,
  myRoomComment,
  setMyRoomComment,
  isSubmittingRoomReview,
  onSubmitRoomReview,
  onUpdateRoomReview,
  hasConfirmedBooking = false,
}: Props) {

  const [isEditingReview, setIsEditingReview] = useState(false);
  const [isEditingRoomReview, setIsEditingRoomReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'room' | 'host'>('room');
    
  // Kiểm tra user có thể đánh giá không
  const canReview = currentUser && currentUser.id !== hostId && hasConfirmedBooking;
    
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('room')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'room'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Home className="w-4 h-4" />
          Đánh giá phòng
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'room' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {roomReviews.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('host')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'host'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" />
          Đánh giá chủ nhà
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'host' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {reviews.length}
          </span>
        </button>
      </div>

      {/* Room Reviews Tab */}
      {activeTab === 'room' && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Đánh giá về phòng
          </h3>

          {/* My Room Review */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-800 mb-3">
              {!currentUser ? 'Viết đánh giá' :
                currentUser.id === hostId ? 'Bạn là chủ nhà' :
                myRoomReview ? 'Đánh giá của bạn' : 'Viết đánh giá'}
            </h4>

            {currentUser ? (
              currentUser.id === hostId ? (
                <p className="text-sm text-gray-500">
                  Bạn không thể đánh giá phòng của chính mình.
                </p>
              ) : !hasConfirmedBooking && !myRoomReview ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Bạn cần thuê phòng và thanh toán thành công để đánh giá
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Đánh giá chỉ dành cho người thuê đã hoàn tất thanh toán
                      </p>
                      <Link 
                        href="/dashboard/bookings" 
                        className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Xem đơn đặt phòng của bạn →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : myRoomReview ? (
                <div className="flex gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <img
                    src={myRoomReview.renter.avatarUrl || '/avatar-placeholder.png'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {myRoomReview.renter.fullName}
                      </p>
                      <span className="text-sm text-gray-500">
                        {new Date(myRoomReview.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {!isEditingRoomReview && (
                      <>
                        <StarRating value={myRoomReview.rating} readonly />
                        <p className="text-gray-700 mt-2 text-sm">{myRoomReview.comment}</p>
                        <button
                          onClick={() => {
                            setIsEditingRoomReview(true);
                            setMyRoomRating(myRoomReview.rating);
                            setMyRoomComment(myRoomReview.comment);
                          }}
                          className="text-sm text-amber-600 mt-2 hover:underline"
                        >
                          Chỉnh sửa
                        </button>
                      </>
                    )}

                    {isEditingRoomReview && (
                      <div className="mt-3 space-y-3">
                        <StarRating value={myRoomRating} onChange={setMyRoomRating} />
                        <textarea
                          value={myRoomComment}
                          onChange={(e) => setMyRoomComment(e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-amber-200 p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              onUpdateRoomReview(myRoomReview.id);
                              setIsEditingRoomReview(false);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm hover:bg-amber-700"
                          >
                            Cập nhật
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingRoomReview(false);
                              setMyRoomRating(myRoomReview.rating);
                              setMyRoomComment(myRoomReview.comment);
                            }}
                            className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-100"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <StarRating value={myRoomRating} onChange={setMyRoomRating} />
                  <textarea
                    value={myRoomComment}
                    onChange={(e) => setMyRoomComment(e.target.value)}
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn về phòng..."
                    className="w-full rounded-xl border border-amber-200 p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={onSubmitRoomReview}
                    disabled={isSubmittingRoomReview || myRoomRating === 0}
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    Gửi đánh giá phòng
                  </button>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-500">
                Vui lòng đăng nhập để đánh giá phòng.
              </p>
            )}
          </div>

          {/* Other Room Reviews */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">
              Đánh giá từ người khác
            </h4>
            {roomReviews.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có đánh giá nào về phòng.</p>
            ) : (
              <div className="space-y-4">
                {roomReviews.filter(r => r.renter.id !== currentUser?.id).map((review) => (
                  <div key={review.id} className="flex gap-4 p-4 rounded-xl border border-gray-100">
                    <img
                      src={review.renter.avatarUrl || '/avatar-placeholder.png'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900">{review.renter.fullName}</p>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <StarRating value={review.rating} readonly />
                      <p className="text-gray-700 mt-2 text-sm">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Host Reviews Tab */}
      {activeTab === 'host' && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-500" />
            Đánh giá về chủ nhà
          </h3>

          {/* My Host Review */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-800 mb-3">
              {!currentUser ? 'Viết đánh giá' :
                currentUser.id === hostId ? 'Bạn là chủ nhà' :
                myReview ? 'Đánh giá của bạn' : 'Viết đánh giá'}
            </h4>

            {currentUser ? (
              currentUser.id === hostId ? (
                <p className="text-sm text-gray-500">
                  Hãy quan tâm đến cảm nghĩ của khách hàng nhé.
                </p>
              ) : !hasConfirmedBooking && !myReview ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Bạn cần thuê phòng và thanh toán thành công để đánh giá chủ nhà
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Đánh giá chỉ dành cho người thuê đã hoàn tất thanh toán
                      </p>
                      <Link 
                        href="/dashboard/bookings" 
                        className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Xem đơn đặt phòng của bạn →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : myReview ? (
                <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <img
                    src={myReview.reviewer.avatarUrl || '/avatar-placeholder.png'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{myReview.reviewer.fullName}</p>
                      <span className="text-sm text-gray-500">
                        {new Date(myReview.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {!isEditingReview && (
                      <>
                        <StarRating value={myReview.rating} readonly />
                        <p className="text-gray-700 mt-2 text-sm">{myReview.comment}</p>
                        <button
                          onClick={() => {
                            setIsEditingReview(true);
                            setMyRating(myReview.rating);
                            setMyComment(myReview.comment);
                          }}
                          className="text-sm text-blue-600 mt-2 hover:underline"
                        >
                          Chỉnh sửa
                        </button>
                      </>
                    )}

                    {isEditingReview && (
                      <div className="mt-3 space-y-3">
                        <StarRating value={myRating} onChange={setMyRating} />
                        <textarea
                          value={myComment}
                          onChange={(e) => setMyComment(e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-blue-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              onUpdateReview(myReview.id);
                              setIsEditingReview(false);
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700"
                          >
                            Cập nhật
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingReview(false);
                              setMyRating(myReview.rating);
                              setMyComment(myReview.comment);
                            }}
                            className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-100"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <StarRating value={myRating} onChange={setMyRating} />
                  <textarea
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn về chủ nhà..."
                    className="w-full rounded-xl border border-blue-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={onSubmitReview}
                    disabled={isSubmittingReview || myRating === 0}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Gửi đánh giá chủ nhà
                  </button>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-500">
                Vui lòng đăng nhập để đánh giá chủ nhà.
              </p>
            )}
          </div>

          {/* Other Host Reviews */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">
              Đánh giá từ người khác
            </h4>
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có đánh giá nào về chủ nhà.</p>
            ) : (
              <div className="space-y-4">
                {reviews.filter(r => r.reviewer.id !== currentUser?.id).map((review) => (
                  <div key={review.id} className="flex gap-4 p-4 rounded-xl border border-gray-100">
                    <img
                      src={review.reviewer.avatarUrl || '/avatar-placeholder.png'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900">{review.reviewer.fullName}</p>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <StarRating value={review.rating} readonly />
                      <p className="text-gray-700 mt-2 text-sm">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
