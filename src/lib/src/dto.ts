import {IsOptional, IsString, ValidateIf, IsEnum, IsBoolean, IsNumber} from 'class-validator'

export enum Vorstosstyp {
  MOTION = 'motion',
  INTERPELLATION = 'interpellation',
  POSTULAT = 'postulat',
  ANFRAGE = 'anfrage',
  BESCHLUSSANTRAG = 'beschlussantrag',
  INITIATIVE = 'initiative',
}

export class GeneratePdfDto {
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.antrag && !o.begruendung)
  text?: string

  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.text && o.begroendung)
  antrag?: string

  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.text && o.antrag)
  begruendung?: string

  @IsOptional()
  @IsEnum(Vorstosstyp)
  vorstosstyp?: Vorstosstyp

  @IsOptional()
  @IsBoolean()
  dringlich?: boolean = false

  @IsOptional()
  @IsBoolean()
  budget?: boolean = false

  @IsOptional()
  @IsString()
  betreffend?: string = 'Vorstoss'

  @IsOptional()
  @IsString()
  eingereichtvon?: string = 'System'

  @IsOptional()
  @IsString()
  datum?: string

  @IsOptional()
  @IsString()
  nummer?: string = '2024.001'

  @IsOptional()
  @IsNumber()
  unterstuetzer?: number = 1
}
