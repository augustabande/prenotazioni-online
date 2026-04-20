import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto, UpdateInstructorDto } from './dto/instructor.dto';

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.instructor.findMany({
      where: { active: true },
      include: { user: true },
    });
  }

  async create(dto: CreateInstructorDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: dto.email, name: dto.name, role: Role.INSTRUCTOR },
      });
      return tx.instructor.create({
        data: {
          userId: user.id,
          bio: dto.bio,
          certifications: dto.certifications,
          colorHex: dto.colorHex,
        },
        include: { user: true },
      });
    });
  }

  async update(id: string, dto: UpdateInstructorDto) {
    const inst = await this.prisma.instructor.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('Instructor not found');
    return this.prisma.instructor.update({
      where: { id },
      data: dto,
      include: { user: true },
    });
  }
}
