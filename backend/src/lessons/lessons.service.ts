import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonTypeDto, UpdateLessonTypeDto } from './dto/lesson-type.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.lessonType.findMany({ where: { active: true } });
  }

  async findOne(id: string) {
    const lt = await this.prisma.lessonType.findUnique({ where: { id } });
    if (!lt) throw new NotFoundException('Lesson type not found');
    return lt;
  }

  create(dto: CreateLessonTypeDto) {
    return this.prisma.lessonType.create({ data: dto });
  }

  async update(id: string, dto: UpdateLessonTypeDto) {
    await this.findOne(id);
    return this.prisma.lessonType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lessonType.update({ where: { id }, data: { active: false } });
  }
}
