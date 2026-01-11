import React from 'react';
import { X, Star, Upload, Image as ImageIcon } from 'lucide-react';

interface ExistingImage {
    id: number;
    imageUrl: string;
    isThumbnail: boolean;
}

interface Step5Props {
    existingImages: ExistingImage[];
    newImagePreviews: string[];
    coverImageId: number | null;
    newCoverIndex: number | null;
    onNewImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveExisting: (imageId: number) => void;
    onRemoveNew: (index: number) => void;
    onSetExistingCover: (imageId: number) => void;
    onSetNewCover: (index: number) => void;
    errors?: Record<string, string>;
}

const Step5_Images_Edit: React.FC<Step5Props> = ({
    existingImages,
    newImagePreviews,
    coverImageId,
    newCoverIndex,
    onNewImageUpload,
    onRemoveExisting,
    onRemoveNew,
    onSetExistingCover,
    onSetNewCover,
    errors,
}) => {
    const totalImages = existingImages.length + newImagePreviews.length;
    const hasImages = totalImages > 0;
    const hasError = errors?.images;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className={`border rounded-xl p-4 flex items-start gap-3 ${hasError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <ImageIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasError ? 'text-red-600' : 'text-blue-600'}`} />
                <div className={`text-sm ${hasError ? 'text-red-900' : 'text-blue-900'}`}>
                    <p className="font-semibold mb-1">Quản lý hình ảnh</p>
                    <ul className={`space-y-1 ${hasError ? 'text-red-700' : 'text-blue-700'}`}>
                        <li><strong>• Chỉ chấp nhận JPG, PNG. Tối thiểu 4 ảnh.</strong></li>
                        <li>• Xóa ảnh cũ bằng cách click nút X</li>
                        <li>• Thêm ảnh mới từ máy tính</li>
                        <li>• Click biểu tượng ⭐ để chọn ảnh đại diện</li>
                        <li>• Tối đa 10 ảnh (bao gồm cả ảnh cũ và mới)</li>
                    </ul>
                </div>
            </div>

            {hasError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">⚠️ {errors.images}</p>
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex gap-6">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Ảnh hiện có</p>
                        <p className="text-lg font-bold text-slate-900">{existingImages.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Ảnh mới</p>
                        <p className="text-lg font-bold text-blue-600">{newImagePreviews.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Tổng cộng</p>
                        <p className={`text-lg font-bold ${totalImages >= 4 ? 'text-green-600' : 'text-orange-600'}`}>
                            {totalImages} / 10 {totalImages >= 4 ? '✓' : '(cần ' + (4 - totalImages) + ' ảnh)'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Existing Images Section */}
            {existingImages.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        Ảnh hiện có ({existingImages.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {existingImages.map((img) => (
                            <div
                                key={img.id}
                                className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                    coverImageId === img.id
                                        ? 'border-yellow-500 ring-4 ring-yellow-100'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <img
                                    src={img.imageUrl}
                                    alt="Existing"
                                    className="w-full h-full object-cover"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Delete button */}
                                <button
                                    onClick={() => onRemoveExisting(img.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                    title="Xóa ảnh"
                                >
                                    <X size={16} />
                                </button>

                                {/* Set cover button */}
                                <button
                                    onClick={() => onSetExistingCover(img.id)}
                                    className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all shadow-lg ${
                                        coverImageId === img.id
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-white/90 text-slate-700 opacity-0 group-hover:opacity-100 hover:bg-yellow-500 hover:text-white'
                                    }`}
                                    title="Đặt làm ảnh đại diện"
                                >
                                    <Star size={12} fill={coverImageId === img.id ? 'white' : 'none'} />
                                    {coverImageId === img.id ? 'Ảnh đại diện' : 'Chọn'}
                                </button>

                                {/* Current thumbnail badge */}
                                {img.isThumbnail && coverImageId !== img.id && (
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-700/80 text-white text-[10px] font-semibold rounded">
                                        Đại diện cũ
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Images Section */}
            {newImagePreviews.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Ảnh mới thêm ({newImagePreviews.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {newImagePreviews.map((preview, idx) => (
                            <div
                                key={idx}
                                className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                    newCoverIndex === idx
                                        ? 'border-yellow-500 ring-4 ring-yellow-100'
                                        : 'border-blue-200 hover:border-blue-300'
                                }`}
                            >
                                <img
                                    src={preview}
                                    alt={`New ${idx}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* "NEW" badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
                                    MỚI
                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Delete button */}
                                <button
                                    onClick={() => onRemoveNew(idx)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                    title="Xóa ảnh mới"
                                >
                                    <X size={16} />
                                </button>

                                {/* Set cover button */}
                                <button
                                    onClick={() => onSetNewCover(idx)}
                                    className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all shadow-lg ${
                                        newCoverIndex === idx
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-white/90 text-slate-700 opacity-0 group-hover:opacity-100 hover:bg-yellow-500 hover:text-white'
                                    }`}
                                    title="Đặt làm ảnh đại diện"
                                >
                                    <Star size={12} fill={newCoverIndex === idx ? 'white' : 'none'} />
                                    {newCoverIndex === idx ? 'Ảnh đại diện' : 'Chọn'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload Button */}
            <div>
                <label className="cursor-pointer block">
                    <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={onNewImageUpload}
                        className="hidden"
                        disabled={totalImages >= 10}
                    />
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                            totalImages >= 10
                                ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                                : 'border-blue-300 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                    >
                        <Upload className={`w-10 h-10 mx-auto mb-3 ${totalImages >= 10 ? 'text-slate-400' : 'text-blue-600'}`} />
                        
                        {totalImages >= 10 ? (
                            <div>
                                <p className="text-slate-600 font-semibold mb-1">Đã đủ 10 ảnh</p>
                                <p className="text-xs text-slate-500">Xóa ảnh cũ để thêm ảnh mới</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-blue-900 font-semibold mb-1">Thêm ảnh mới</p>
                                <p className="text-xs text-blue-700">
                                    Click để chọn ảnh từ máy tính • Còn {10 - totalImages} ảnh
                                </p>
                            </div>
                        )}
                    </div>
                </label>
            </div>

            {/* Warning if no images */}
            {!hasImages && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">⚠️</span>
                    </div>
                    <div className="text-sm text-amber-900">
                        <p className="font-semibold">Chưa có hình ảnh nào</p>
                        <p className="text-amber-700">Tin đăng cần ít nhất 1 ảnh để thu hút người thuê</p>
                    </div>
                </div>
            )}

            {/* Cover selection warning */}
            {hasImages && coverImageId === null && newCoverIndex === null && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-900">
                        <span className="font-semibold">Chưa chọn ảnh đại diện!</span> Click biểu tượng ⭐ trên ảnh để chọn.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Step5_Images_Edit;
