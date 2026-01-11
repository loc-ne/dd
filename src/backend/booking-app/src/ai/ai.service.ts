import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';

// Entities
import { Room } from '../room/entities/room.entity';
import { Review } from '../review/entities/review.entity';
import { UserReview } from '../user-review/user-review.entity';
import { User } from '../user/user.entity';
import { RoomImage } from '../room/entities/room-image.entity';

// Interfaces for formatted data
interface RoomContext {
    id: number;
    title: string;
    description: string;
    roomType: string;
    price: number;
    deposit: number;
    area: number;
    guestCapacity: number;
    minLeaseTerm: number;
    address: string;
    city: string;
    district: string;
    ward: string;
    lat: number;
    lng: number;
    amenities: string[];
    electricityPrice: string;
    waterPrice: string;
    wifiPrice: string;
    parkingFee: string;
    managementFee: string;
    miscNotes: string;
    cookingAllowed: boolean;
    petAllowed: boolean;
    gender: string;
    curfew: boolean;
    curfewTime: string;
    status: string;
    hostName: string;
    hostPhone: string;
    hostRating: number;
    hostReviewCount: number;
}

interface ReviewContext {
    renterName: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

interface HostReviewContext {
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

// Response với suggested questions
export interface AiChatResponse {
    message: string;
    suggestedQuestions: string[];
}

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(
        private configService: ConfigService,
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(UserReview)
        private readonly userReviewRepository: Repository<UserReview>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(RoomImage)
        private readonly roomImageRepository: Repository<RoomImage>,
    ) {

        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            console.warn('GEMINI_API_KEY not found in environment variables');
        }
        this.genAI = new GoogleGenerativeAI(apiKey || '');

        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096, // Tăng từ 2048 lên 4096 để tránh bị cắt response
                topP: 0.95,
                topK: 40,
            },
        });
    }

    /**
     * Hàm chat - có hỗ trợ phân tích ảnh phòng
     * Trả về message + suggested questions
     */
    async chatWithGemini(userMessage: string, roomId: number): Promise<AiChatResponse> {
        try {
            const roomContext = await this.getRoomData(roomId);
            if (!roomContext) {
                return {
                    message: 'Xin lỗi, không tìm thấy thông tin phòng này. Vui lòng kiểm tra lại mã phòng.',
                    suggestedQuestions: [],
                };
            }

            const reviewsContext = await this.getRoomReviews(roomId);
            const hostReviewsContext = await this.getHostReviews(roomContext.hostName);
            const policyContext = this.getSystemPolicies();

            // Lấy ảnh phòng để AI phân tích
            const roomImages = await this.getRoomImages(roomId);

            const systemInstruction = this.buildSystemPrompt(
                roomContext,
                reviewsContext,
                hostReviewsContext,
                policyContext,
                roomImages.length > 0, 
            );

            const systemParts: Part[] = [{ text: systemInstruction }];

            if (roomImages.length > 0) {
                const imageParts = await this.convertImagesToBase64Parts(roomImages.slice(0, 5));
                systemParts.push(...imageParts);
            }

            const chat = this.model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: systemParts,
                    },
                    {
                        role: 'model',
                        parts: [
                            {
                                text: 'Đã hiểu. Tôi đã xem qua thông tin và hình ảnh của phòng. Tôi sẵn sàng hỗ trợ bạn!',
                            },
                        ],
                    },
                ],
            });

            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            let responseText = response.text();
            
            // Kiểm tra nếu response bị cắt giữa chừng (không kết thúc đúng)
            const finishReason = response.candidates?.[0]?.finishReason;
            if (finishReason === 'MAX_TOKENS') {
                responseText += '\n\n*(...Câu trả lời bị giới hạn độ dài. Bạn có thể hỏi tiếp để biết thêm chi tiết.)*';
            }
            
            // Generate suggested questions dựa trên context và câu hỏi hiện tại
            const suggestedQuestions = this.generateSuggestedQuestions(userMessage, roomContext);
            
            console.log('AI Response:', responseText);
            return {
                message: responseText,
                suggestedQuestions,
            };
        } catch (error) {
            console.error('AI Error:', error);
            if (error instanceof NotFoundException) {
                return {
                    message: error.message,
                    suggestedQuestions: [],
                };
            }
            return {
                message: 'Xin lỗi, hiện tại hệ thống AI đang quá tải. Bạn vui lòng thử lại sau nhé!',
                suggestedQuestions: ['Thử lại câu hỏi'],
            };
        }
    }

    /**
     * Generate suggested questions dựa trên context và câu hỏi trước đó
     */
    private generateSuggestedQuestions(lastQuestion: string, roomContext: RoomContext): string[] {
        const allSuggestions: { question: string; category: string; priority: number }[] = [];
        const lowerQuestion = lastQuestion.toLowerCase();

        // Phân loại câu hỏi vừa hỏi để gợi ý câu hỏi khác category
        const askedAboutPrice = /giá|tiền|chi phí|cọc|thuê|tháng/.test(lowerQuestion);
        const askedAboutLocation = /địa chỉ|vị trí|gần|khu vực|đường|quận/.test(lowerQuestion);
        const askedAboutAmenities = /tiện ích|wifi|điện|nước|máy lạnh|nội thất/.test(lowerQuestion);
        const askedAboutRules = /quy định|giờ giấc|thú cưng|nấu ăn|giới nghiêm/.test(lowerQuestion);
        const askedAboutHost = /chủ nhà|liên hệ|đánh giá|review/.test(lowerQuestion);
        const askedAboutRoom = /phòng|diện tích|rộng|người|ở được/.test(lowerQuestion);
        const askedAboutSafety = /an toàn|an ninh|bảo vệ|camera/.test(lowerQuestion);

        // === CHI PHÍ ===
        if (!askedAboutPrice) {
            allSuggestions.push(
                { question: 'Tổng chi phí hàng tháng là bao nhiêu?', category: 'price', priority: 1 },
                { question: 'Tiền cọc và điều kiện hoàn cọc?', category: 'price', priority: 2 },
            );
        } else {
            // Nếu đã hỏi về giá, gợi ý chi tiết hơn
            allSuggestions.push(
                { question: 'Có phí phát sinh nào khác không?', category: 'price', priority: 3 },
            );
        }

        // === VỊ TRÍ ===
        if (!askedAboutLocation) {
            allSuggestions.push(
                { question: 'Khu vực xung quanh có gì?', category: 'location', priority: 1 },
                { question: 'Có hay bị ngập nước không?', category: 'location', priority: 2 },
            );
        }

        // === TIỆN ÍCH ===
        if (!askedAboutAmenities) {
            allSuggestions.push(
                { question: 'Phòng có những tiện ích gì?', category: 'amenities', priority: 1 },
            );
            if (roomContext.amenities.length > 0) {
                allSuggestions.push(
                    { question: 'Wifi có ổn định không?', category: 'amenities', priority: 3 },
                );
            }
        }

        // === QUY ĐỊNH ===
        if (!askedAboutRules) {
            if (roomContext.curfew) {
                allSuggestions.push(
                    { question: 'Giờ giới nghiêm cụ thể là mấy giờ?', category: 'rules', priority: 2 },
                );
            }
            if (!roomContext.petAllowed) {
                allSuggestions.push(
                    { question: 'Có được nuôi thú cưng không?', category: 'rules', priority: 3 },
                );
            }
            allSuggestions.push(
                { question: 'Quy định của phòng như thế nào?', category: 'rules', priority: 2 },
            );
        }

        // === CHỦ NHÀ ===
        if (!askedAboutHost) {
            if (roomContext.hostReviewCount > 0) {
                allSuggestions.push(
                    { question: 'Đánh giá về chủ nhà như thế nào?', category: 'host', priority: 1 },
                );
            }
            allSuggestions.push(
                { question: 'Chủ nhà có uy tín không?', category: 'host', priority: 2 },
            );
        }

        // === PHÒNG ===
        if (!askedAboutRoom) {
            allSuggestions.push(
                { question: 'Phòng trông như thế nào?', category: 'room', priority: 1 },
                { question: 'Có nên thuê phòng này không?', category: 'room', priority: 1 },
            );
        }

        // === AN TOÀN ===
        if (!askedAboutSafety) {
            allSuggestions.push(
                { question: 'Khu vực có an toàn không?', category: 'safety', priority: 2 },
            );
        }

        // === QUY TRÌNH ===
        allSuggestions.push(
            { question: 'Quy trình đặt phòng như thế nào?', category: 'process', priority: 3 },
        );

        // Sắp xếp theo priority và loại bỏ category đã hỏi, lấy tối đa 4 câu
        const sortedSuggestions = allSuggestions
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 4)
            .map(s => s.question);

        return sortedSuggestions;
    }

    /**
     * Chat tổng quát không cần roomId (hỏi đáp chung về thuê phòng)
     */
    async chatGeneral(userMessage: string): Promise<string> {
        try {
            const policyContext = this.getSystemPolicies();
            const systemInstruction = `
        Bạn là "Trợ lý ảo AI" chuyên nghiệp của hệ thống tìm phòng trọ newbie.com.
        MỤC TIÊU: Hỗ trợ người dùng với các câu hỏi chung về thuê phòng trọ.

        --- QUY ĐỊNH HỆ THỐNG ---
        ${policyContext}
        --- YÊU CẦU TRẢ LỜI ---
        - Trả lời ngắn gọn, thân thiện
        - Định dạng Markdown (xuống dòng, in đậm các ý chính).
        - Nếu người dùng hỏi về phòng cụ thể, hãy gợi ý họ truy cập vào trang xem chi tiết phòng trên newbie.com để có thông tin chính xác nhất.
      `;

            const chat = this.model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: systemInstruction }],
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Đã hiểu. Tôi sẵn sàng hỗ trợ bạn.' }],
                    },
                ],
            });

            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI General Chat Error:', error);
            return 'Xin lỗi, hiện tại hệ thống AI đang quá tải. Bạn vui lòng thử lại sau nhé!';
        }
    }

    /**
     * Lấy thông tin phòng từ database
     */
    private async getRoomData(roomId: number): Promise<RoomContext | null> {
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
            relations: ['host', 'roomAmenities', 'roomAmenities.amenity'],
        });

        if (!room) {
            return null;
        }

        const amenities = room.roomAmenities?.map((ra) => ra.amenity?.name).filter(Boolean) || [];

        const fullAddress = [room.address, room.ward, room.district, room.city]
            .filter(Boolean)
            .join(', ');

        return {
            id: room.id,
            title: room.title,
            description: room.description || 'Chưa có mô tả',
            roomType: this.formatRoomType(room.roomType),
            price: Number(room.pricePerMonth),
            deposit: Number(room.deposit),
            area: room.area,
            guestCapacity: room.guestCapacity,
            minLeaseTerm: room.minLeaseTerm,
            address: fullAddress,
            city: room.city,
            district: room.district,
            ward: room.ward,
            lat: room.latitude,
            lng: room.longitude,
            amenities: amenities,
            electricityPrice: this.formatUtilityPrice(room.electricityPrice, room.electricityUnit),
            waterPrice: this.formatUtilityPrice(room.waterPrice, room.waterUnit),
            wifiPrice: this.formatPrice(room.wifiPrice) + '/tháng',
            parkingFee: this.formatPrice(room.parkingFee) + '/tháng',
            managementFee: this.formatPrice(room.managementFee) + '/tháng',
            miscNotes: room.miscNotes || 'Không có ghi chú thêm',
            cookingAllowed: room.cookingAllowed,
            petAllowed: room.petAllowed,
            gender: this.formatGender(room.gender),
            curfew: room.curfew,
            curfewTime: room.curfewTime || 'Không áp dụng',
            status: room.status,
            hostName: room.contactName || room.host?.fullName || 'Chủ nhà',
            hostPhone: room.phone || room.host?.phoneNumber || 'Chưa cập nhật',
            hostRating: Number(room.host?.avgRating) || 0,
            hostReviewCount: room.host?.reviewCount || 0,
        };
    }

    /**
     * Lấy đánh giá về phòng từ database
     */
    private async getRoomReviews(roomId: number): Promise<string> {
        const reviews = await this.reviewRepository.find({
            where: { roomId },
            relations: ['renter'],
            order: { createdAt: 'DESC' },
            take: 10,
        });

        if (!reviews || reviews.length === 0) {
            return 'Chưa có đánh giá nào cho phòng này.';
        }

        const avgRating =
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        const reviewTexts = reviews.map((review, index) => {
            const renterName = review.renter?.fullName || 'Người thuê ẩn danh';
            const stars = '⭐'.repeat(review.rating);
            const comment = review.comment || 'Không có nhận xét';
            return `${index + 1}. ${renterName} ${stars}: "${comment}"`;
        });

        return `
    Điểm trung bình: ${avgRating.toFixed(1)}/5 (${reviews.length} đánh giá)
    
    ${reviewTexts.join('\n    ')}
    `;
    }

    /**
     * Lấy đánh giá về chủ nhà từ database
     */
    private async getHostReviews(hostName: string): Promise<string> {
        const host = await this.userRepository.findOne({
            where: { fullName: hostName, isHost: true },
        });

        if (!host) {
            return 'Chưa có thông tin đánh giá về chủ nhà.';
        }

        const hostReviews = await this.userReviewRepository.find({
            where: { host: { id: host.id } },
            relations: ['reviewer'],
            order: { createdAt: 'DESC' },
            take: 5,
        });

        if (!hostReviews || hostReviews.length === 0) {
            return `Chủ nhà ${hostName} chưa có đánh giá nào.`;
        }

        const reviewTexts = hostReviews.map((review, index) => {
            const reviewerName = review.reviewer?.fullName || 'Người dùng ẩn danh';
            const stars = '⭐'.repeat(Math.round(Number(review.rating)));
            const comment = review.comment || 'Không có nhận xét';
            return `${index + 1}. ${reviewerName} ${stars}: "${comment}"`;
        });

        return `
     Đánh giá về chủ nhà ${hostName}:
    - Điểm trung bình: ${Number(host.avgRating).toFixed(1)}/5 (${host.reviewCount} đánh giá)
    
    ${reviewTexts.join('\n    ')}
    `;
    }

    /**
     * Build system prompt cho AI
     */
    private buildSystemPrompt(
        roomContext: RoomContext,
        reviewsContext: string,
        hostReviewsContext: string,
        policyContext: string,
        hasImages: boolean = false,
    ): string {
        // Thêm hướng dẫn phân tích ảnh nếu có ảnh
        const imageAnalysisInstruction = hasImages ? `
        === HÌNH ẢNH PHÒNG ===
        Bạn đã được cung cấp ${hasImages ? 'một số' : 'không có'} hình ảnh của phòng.
        Khi người dùng hỏi về:
        - Tình trạng phòng, nội thất, không gian → Hãy mô tả dựa trên ảnh bạn thấy
        - Độ sạch sẽ, ánh sáng, cửa sổ → Phân tích từ hình ảnh
        - So sánh với mô tả → Đối chiếu ảnh với thông tin text
        - "Phòng trông như thế nào?" → Mô tả chi tiết từ ảnh
        ` : '';

        return `
        Bạn là "Trợ lý ảo AI" chuyên nghiệp của hệ thống tìm phòng trọ newbie.com.
        
        MỤC TIÊU CỦA BẠN: Hỗ trợ người dùng thuê phòng dựa trên dữ liệu thực tế được cung cấp dưới đây.
        ${imageAnalysisInstruction}

        === DỮ LIỆU PHÒNG (CONTEXT) ===
        THÔNG TIN CƠ BẢN:
        - Mã phòng: #${roomContext.id}
        - Tên phòng: ${roomContext.title}
        - Loại hình: ${roomContext.roomType}
        - Mô tả: ${roomContext.description}
        - Trạng thái: ${roomContext.status}

        ĐỊA CHỈ:
        - Địa chỉ đầy đủ: ${roomContext.address}
        - Tọa độ (Lat/Long): ${roomContext.lat}, ${roomContext.lng}

        THÔNG SỐ KỸ THUẬT:
        - Diện tích: ${roomContext.area} m²
        - Sức chứa tối đa: ${roomContext.guestCapacity} người
        - Thời hạn thuê tối thiểu: ${roomContext.minLeaseTerm} tháng

        GIÁ CẢ:
        - Giá thuê: ${this.formatPrice(roomContext.price)}/tháng
        - Tiền cọc: ${this.formatPrice(roomContext.deposit)}
        - Tiền điện: ${roomContext.electricityPrice}
        - Tiền nước: ${roomContext.waterPrice}
        - Wifi: ${roomContext.wifiPrice}
        - Phí giữ xe: ${roomContext.parkingFee}
        - Phí dịch vụ/quản lý: ${roomContext.managementFee}
        - Ghi chú chi phí: ${roomContext.miscNotes}

        TIỆN ÍCH:
        ${roomContext.amenities.length > 0 ? roomContext.amenities.join(', ') : 'Chưa cập nhật tiện ích'}

        QUY ĐỊNH PHÒNG:
        - Nấu ăn: ${roomContext.cookingAllowed ? 'Được phép' : 'Không được phép'}
        - Thú cưng: ${roomContext.petAllowed ? 'Được phép' : 'Không được phép'}
        - Đối tượng: ${roomContext.gender}
        - Giờ giới nghiêm: ${roomContext.curfew ? `Có (${roomContext.curfewTime})` : 'Không'}

        THÔNG TIN CHỦ NHÀ:
        - Tên: ${roomContext.hostName}
        - SĐT: ${roomContext.hostPhone}
        - Điểm đánh giá: ${roomContext.hostRating}/5 (${roomContext.hostReviewCount} đánh giá)

        === ĐÁNH GIÁ VỀ PHÒNG ===
        ${reviewsContext}

        === ĐÁNH GIÁ VỀ CHỦ NHÀ ===
        ${hostReviewsContext}

        === QUY ĐỊNH HỆ THỐNG ===
        ${policyContext}

        === NHIỆM VỤ CỤ THỂ (6 TÍNH NĂNG VIP) ===
        Khi trả lời, hãy vận dụng các tư duy sau:
        1. [Phân tích chi tiết]: Luôn bám sát thông tin của phòng #${roomContext.id}, không bịa đặt thông tin không có trong Context.
        2. [An toàn & Tiện ích]: Dựa vào tiện ích và đánh giá để nhận xét độ an toàn (VD: có camera, bảo vệ, khóa vân tay).
        3. [Tổng hợp Review]: Nếu người dùng hỏi về chất lượng, hãy tóm tắt review (khen/chê) một cách khách quan.
        4. [Quy định]: Trả lời thắc mắc về cọc, hợp đồng dựa trên quy định hệ thống.
        5. [Dự toán chi phí - QUAN TRỌNG]: Nếu người dùng hỏi về "tổng tiền" hoặc "chi phí hàng tháng", hãy tính toán dựa trên:
           - Giá thuê: ${this.formatPrice(roomContext.price)}
           - Điện (ước tính 100kWh): ${roomContext.electricityPrice}
           - Nước (1 người): ${roomContext.waterPrice}
           - Wifi + Dịch vụ: ${roomContext.wifiPrice} + ${roomContext.managementFee}
           - Gửi xe (nếu có): ${roomContext.parkingFee}
        6. [Neighborhood Check]: Dựa vào tọa độ (${roomContext.lat}, ${roomContext.lng}) và kiến thức địa lý, hãy nhận xét về:
           - Khu vực xung quanh (an ninh, tiện ích gần đó)
           - Tình trạng ngập lụt (nếu biết)
           - Gần trường học/bệnh viện/siêu thị nào

        === YÊU CẦU TRẢ LỜI ===
        - Trả lời ngắn gọn, súc tích, thân thiện (tối đa 500 từ).
        - Định dạng Markdown (xuống dòng, in đậm các ý chính).
        - Nếu không có thông tin trong Context, hãy nói "Hiện tại dữ liệu chưa cập nhật thông tin này".
        - Khi tính toán chi phí, hiển thị rõ từng khoản và tổng cộng.
        - QUAN TRỌNG: Đừng liệt kê quá dài, hãy tập trung vào câu hỏi của người dùng.
      `;
    }

    /**
       * Quy trình Thuê & Chính sách Hoàn tiền (Cập nhật 06/11/2025)
       */
    private getSystemPolicies(): string {
        return `
    === QUY TRÌNH THUÊ PHÒNG (4 BƯỚC) ===
    1. Gửi yêu cầu: Khách chọn phòng và gửi yêu cầu thuê trên hệ thống.
    2. Chủ nhà duyệt: Chủ nhà xem xét hồ sơ và chấp nhận yêu cầu.
    3. Đặt cọc giữ chỗ: Khách thanh toán tiền cọc thông qua hệ thống trung gian của newbie.com.
    4. Nhận phòng: Khách gặp chủ nhà, ký hợp đồng giấy và nhận phòng để hoàn tất.

    === CHÍNH SÁCH HỦY PHÒNG & HOÀN TIỀN ===
    - Trước khi đặt cọc: Khách có thể hủy bất cứ lúc nào, miễn phí 100%.
    - Chủ nhà hủy sau khi khách đã cọc: Khách được hoàn tiền 100%. Chủ nhà bị đánh dấu lịch sử xấu.
    - Khách hủy đúng quy định: Được hoàn cọc (có thể trừ một khoản phí nhỏ theo quy định thời gian cụ thể).
    - Khách hủy quá hạn hoặc bỏ cọc: KHÔNG được hoàn tiền. Tiền cọc sẽ được chuyển cho Chủ nhà để bù đắp thiệt hại.

    === CAM KẾT BẢO VỆ KHOẢN CỌC ===
    - Tiền cọc được hệ thống PhongTro.vn giữ an toàn làm trung gian.
    - Hệ thống chỉ chuyển tiền cho Chủ nhà SAU KHI khách đã nhận phòng thành công.
    - Miễn phí môi giới hoàn toàn cho đối tượng Sinh viên.

    === NGHĨA VỤ NGƯỜI THUÊ ===
    - Thanh toán tiền thuê đúng hạn.
    - Giữ gìn vệ sinh và tuân thủ nội quy của chủ nhà.
    - Cần liên hệ hỗ trợ ngay nếu có tranh chấp trong quá trình nhận phòng.
    `;
    }

    // ==================== HELPER FUNCTIONS ====================

    private formatPrice(price: number | string): string {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (isNaN(numPrice) || numPrice === 0) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN').format(numPrice) + 'đ';
    }

    private formatUtilityPrice(price: number | string, unit: string): string {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (isNaN(numPrice) || numPrice === 0) return 'Miễn phí';

        const formattedPrice = this.formatPrice(numPrice);
        const unitMap: Record<string, string> = {
            KWH: '/kWh',
            M3: '/m³',
            PERSON: '/người',
            ROOM: '/phòng',
            FREE: ' (Miễn phí)',
        };
        return formattedPrice + (unitMap[unit] || '');
    }

    private formatRoomType(type: string): string {
        const typeMap: Record<string, string> = {
            ROOM: 'Phòng trọ',
            STUDIO: 'Chung cư mini / Studio',
            DORM: 'KTX / Ở ghép',
            HOUSE: 'Nhà nguyên căn',
        };
        return typeMap[type] || type;
    }

    private formatGender(gender: string): string {
        const genderMap: Record<string, string> = {
            ALL: 'Tất cả',
            MALE: 'Nam',
            FEMALE: 'Nữ',
        };
        return genderMap[gender] || gender;
    }

    // ==================== IMAGE PROCESSING FUNCTIONS ====================

    /**
     * Lấy danh sách ảnh của phòng từ database
     */
    private async getRoomImages(roomId: number): Promise<RoomImage[]> {
        try {
            const images = await this.roomImageRepository.find({
                where: { roomId },
                order: { isThumbnail: 'DESC' }, // Ảnh thumbnail lên đầu
                take: 5, // Giới hạn 5 ảnh
            });
            return images;
        } catch (error) {
            console.error('Error fetching room images:', error);
            return [];
        }
    }

    /**
     * Convert ảnh từ URL sang base64 Parts cho Gemini
     */
    private async convertImagesToBase64Parts(images: RoomImage[]): Promise<Part[]> {
        const parts: Part[] = [];

        for (const image of images) {
            try {
                const base64Data = await this.fetchImageAsBase64(image.imageUrl);
                if (base64Data) {
                    parts.push({
                        inlineData: {
                            mimeType: this.getMimeType(image.imageUrl),
                            data: base64Data,
                        },
                    });
                }
            } catch (error) {
                console.error(`Error converting image ${image.id}:`, error);
                // Bỏ qua ảnh lỗi, tiếp tục với ảnh khác
            }
        }

        return parts;
    }

    /**
     * Fetch ảnh từ URL và convert sang base64
     */
    private async fetchImageAsBase64(imageUrl: string): Promise<string | null> {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                console.warn(`Failed to fetch image: ${imageUrl}`);
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return buffer.toString('base64');
        } catch (error) {
            console.error(`Error fetching image from ${imageUrl}:`, error);
            return null;
        }
    }

    /**
     * Xác định MIME type từ URL ảnh
     */
    private getMimeType(url: string): string {
        const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
        const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
        };
        return mimeTypes[extension || ''] || 'image/jpeg';
    }

    // ==================== INITIAL SUGGESTIONS ====================

    /**
     * Lấy suggested questions ban đầu khi user mới mở chat
     */
    async getInitialSuggestions(roomId: number): Promise<string[]> {
        const roomContext = await this.getRoomData(roomId);
        if (!roomContext) {
            return [
                'Phòng này giá bao nhiêu?',
                'Có những tiện ích gì?',
                'Khu vực có an toàn không?',
            ];
        }

        const suggestions: string[] = [
            'Tổng chi phí hàng tháng là bao nhiêu?',
            'Phòng trông như thế nào?',
        ];

        // Gợi ý dựa trên đặc điểm phòng
        if (roomContext.hostReviewCount > 0) {
            suggestions.push('Đánh giá về chủ nhà thế nào?');
        }

        if (roomContext.curfew) {
            suggestions.push('Giờ giới nghiêm là mấy giờ?');
        } else {
            suggestions.push('Có quy định gì đặc biệt không?');
        }

        suggestions.push('Có nên thuê phòng này không?');

        return suggestions.slice(0, 4);
    }

    // ==================== COST ESTIMATION ====================

    async estimateMonthlyCost(
        roomId: number,
        electricityUsage: number = 100,
        waterUsage: number = 1,
    ): Promise<{
        breakdown: Record<string, number>;
        total: number;
        formatted: string;
    }> {
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
        });

        if (!room) {
            throw new NotFoundException('Không tìm thấy phòng');
        }

        const rent = Number(room.pricePerMonth);
        const electricity = Number(room.electricityPrice) * electricityUsage;
        const water = Number(room.waterPrice) * waterUsage;
        const wifi = Number(room.wifiPrice);
        const parking = Number(room.parkingFee);
        const management = Number(room.managementFee);

        const total = rent + electricity + water + wifi + parking + management;

        return {
            breakdown: {
                'Tiền thuê phòng': rent,
                [`Tiền điện (${electricityUsage} kWh)`]: electricity,
                [`Tiền nước (${waterUsage} người)`]: water,
                'Tiền wifi': wifi,
                'Phí gửi xe': parking,
                'Phí dịch vụ': management,
            },
            total,
            formatted: `
**DỰ TOÁN CHI PHÍ HÀNG THÁNG**
- Tiền thuê phòng: ${this.formatPrice(rent)}
- Tiền điện (~${electricityUsage} kWh): ${this.formatPrice(electricity)}
- Tiền nước (~${waterUsage} người): ${this.formatPrice(water)}
- Tiền wifi: ${this.formatPrice(wifi)}
- Phí gửi xe: ${this.formatPrice(parking)}
- Phí dịch vụ: ${this.formatPrice(management)}
━━━━━━━━━━━━━━━━━━━━
**TỔNG CỘNG: ${this.formatPrice(total)}**
      `,
        };
    }
}