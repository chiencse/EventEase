import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hashtag } from '../entities/hashtag.entity';
import { HashtagResponseDto } from '../dto/response/hashtag-response.dto';
import { HashtagMapper } from '../mappers/hashtag.mapper';

@Injectable()
export class HashtagService {
    constructor(
        @InjectRepository(Hashtag)
        private readonly hashtagRepository: Repository<Hashtag>,
    ) {}

    /**
     * Tìm kiếm hashtags theo từ khóa
     * @param keyword Từ khóa tìm kiếm
     * @param limit Số lượng kết quả tối đa
     * @returns Danh sách hashtags phù hợp
     */
    async searchHashtags(keyword: string, limit: number = 10): Promise<HashtagResponseDto[]> {
        const hashtags = await this.hashtagRepository
            .createQueryBuilder('hashtag')
            .where('hashtag.name ILIKE :keyword', { keyword: `%${keyword}%` })
            .andWhere('hashtag.isActive = :isActive', { isActive: true })
            .orderBy('hashtag.usageCount', 'DESC')
            .take(limit)
            .getMany();

        return HashtagMapper.toResponseDtoList(hashtags);
    }

    /**
     * Lấy danh sách hashtags phổ biến nhất
     * @param limit Số lượng hashtags cần lấy
     * @returns Danh sách hashtags được sắp xếp theo số lần sử dụng
     */
    async getPopularHashtags(limit: number = 10): Promise<HashtagResponseDto[]> {
        const hashtags = await this.hashtagRepository.find({
            where: { isActive: true },
            order: { usageCount: 'DESC' },
            take: limit
        });

        return HashtagMapper.toResponseDtoList(hashtags);
    }

    /**
     * Tạo mới hoặc lấy hashtag đã tồn tại
     * @param hashtagName Tên hashtag
     * @returns Hashtag object
     */
    async findOrCreateHashtag(hashtagName: string): Promise<Hashtag> {
        // Chuẩn hóa tên hashtag (loại bỏ khoảng trắng, chuyển về chữ thường)
        const normalizedName = hashtagName.trim().toLowerCase();
        
        let hashtag = await this.hashtagRepository.findOne({
            where: { name: normalizedName }
        });

        if (!hashtag) {
            hashtag = this.hashtagRepository.create({
                name: normalizedName,
                usageCount: 1
            });
            await this.hashtagRepository.save(hashtag);
        }

        return hashtag;
    }

    /**
     * Tăng số lần sử dụng của hashtag
     * @param hashtagId ID của hashtag
     */
    async incrementUsageCount(hashtagId: string): Promise<void> {
        await this.hashtagRepository.increment({ id: hashtagId }, 'usageCount', 1);
    }

    /**
     * Cập nhật trạng thái của hashtag
     * @param hashtagId ID của hashtag
     * @param isActive Trạng thái mới
     */
    async updateHashtagStatus(hashtagId: string, isActive: boolean): Promise<void> {
        await this.hashtagRepository.update(hashtagId, { isActive });
    }
} 