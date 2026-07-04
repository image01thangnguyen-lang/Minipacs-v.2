"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var username, password, hashedPassword, roleProfiles, roleProfileByCode, _i, roleProfiles_1, roleProfile, _a, _b, secretaryRole, admin, reportTemplateTexts, _c, reportTemplateTexts_1, template, existing, existingClinicProfile;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    username = process.env.ADMIN_USERNAME || 'admin';
                    password = process.env.ADMIN_PASSWORD || 'admin@123';
                    return [4 /*yield*/, bcrypt.hash(password, 10)];
                case 1:
                    hashedPassword = _d.sent();
                    roleProfiles = [
                        {
                            code: 'ADMIN',
                            name: 'Admin',
                            description: 'Toàn quyền cấu hình hệ thống, PACS, người dùng và dữ liệu vận hành.',
                            baseRole: client_1.Role.ADMIN,
                            permissions: [
                                'studies.read',
                                'reports.read',
                                'reports.write',
                                'reports.finalize',
                                'reports.cancelDraft',
                                'reports.unfinalize',
                                'reports.print',
                                'studies.assign',
                                'studies.updateClinical',
                                'worklist.manage',
                                'archive.read',
                                'archive.deliver',
                                'statistics.read',
                                'statistics.doctorStats',
                                'users.manage',
                                'templates.manage',
                                'clinic.manage',
                                'pacs.manage',
                                'his.read',
                                'his.sync',
                                'his.retry',
                                'his.manage',
                                'admin.catalogs',
                                'admin.facilities',
                                'admin.permissions',
                                'admin.storage',
                                'viewer.configure',
                                'viewer.export',
                                'viewer.anonymize',
                                'viewer.history',
                                'viewer.deleteSeries',
                                'nonDicom.read',
                                'nonDicom.create',
                                'nonDicom.capture',
                                'nonDicom.edit',
                                'nonDicom.deleteMedia',
                                'nonDicom.copyMedia',
                                'nonDicom.print',
                                'nonDicom.video'
                            ],
                            isSystem: true,
                            isActive: true
                        },
                        {
                            code: 'DOCTOR',
                            name: 'Bác sĩ',
                            description: 'Đọc phim, soạn/ký báo cáo, quản lý mẫu cá nhân và xem thống kê chuyên môn.',
                            baseRole: client_1.Role.DOCTOR,
                            permissions: [
                                'studies.read',
                                'reports.read',
                                'reports.write',
                                'reports.finalize',
                                'reports.cancelDraft',
                                'reports.print',
                                'studies.updateClinical',
                                'archive.read',
                                'statistics.read',
                                'statistics.doctorStats',
                                'templates.manage',
                                'his.read',
                                'his.sync',
                                'his.retry',
                                'viewer.configure',
                                'viewer.export',
                                'viewer.anonymize',
                                'viewer.history',
                                'nonDicom.read',
                                'nonDicom.capture',
                                'nonDicom.copyMedia',
                                'nonDicom.print',
                                'nonDicom.video'
                            ],
                            isSystem: true,
                            isActive: true
                        },
                        {
                            code: 'TECHNICIAN',
                            name: 'Kỹ thuật viên',
                            description: 'Theo dõi danh sách ca, tiếp nhận/worklist và xử lý vận hành kỹ thuật.',
                            baseRole: client_1.Role.TECHNICIAN,
                            permissions: ['studies.read', 'studies.assign', 'studies.updateClinical', 'worklist.manage', 'archive.read', 'statistics.read', 'his.read', 'his.sync', 'his.retry', 'viewer.configure', 'viewer.history', 'viewer.export', 'viewer.anonymize', 'nonDicom.read', 'nonDicom.create', 'nonDicom.capture', 'nonDicom.edit', 'nonDicom.deleteMedia', 'nonDicom.copyMedia', 'nonDicom.print', 'nonDicom.video'],
                            isSystem: true,
                            isActive: true
                        },
                        {
                            code: 'RECEPTION',
                            name: 'Lễ tân',
                            description: 'Tạo order, check-in, tìm/in lại kết quả và xem thống kê vận hành cơ bản.',
                            baseRole: client_1.Role.RECEPTION,
                            permissions: ['studies.read', 'worklist.manage', 'archive.read', 'archive.deliver', 'statistics.read', 'reports.print', 'his.read', 'his.sync', 'his.retry', 'nonDicom.read', 'nonDicom.create'],
                            isSystem: true,
                            isActive: true
                        }
                    ];
                    roleProfileByCode = {};
                    _i = 0, roleProfiles_1 = roleProfiles;
                    _d.label = 2;
                case 2:
                    if (!(_i < roleProfiles_1.length)) return [3 /*break*/, 5];
                    roleProfile = roleProfiles_1[_i];
                    _a = roleProfileByCode;
                    _b = roleProfile.code;
                    return [4 /*yield*/, prisma.appRoleProfile.upsert({
                            where: { code: roleProfile.code },
                            update: roleProfile,
                            create: roleProfile
                        })];
                case 3:
                    _a[_b] = _d.sent();
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, prisma.appRoleProfile.findUnique({
                        where: { code: 'DOCTOR_SECRETARY' }
                    })];
                case 6:
                    secretaryRole = _d.sent();
                    if (!!secretaryRole) return [3 /*break*/, 8];
                    return [4 /*yield*/, prisma.appRoleProfile.create({
                            data: {
                                code: 'DOCTOR_SECRETARY',
                                name: 'Thư ký bác sĩ',
                                description: 'Chỉ tra cứu Archive và in lại kết quả theo phân công của bác sĩ.',
                                baseRole: client_1.Role.RECEPTION,
                                permissions: ['archive.read'],
                                isSystem: false,
                                isActive: true
                            }
                        })];
                case 7:
                    _d.sent();
                    _d.label = 8;
                case 8: return [4 /*yield*/, prisma.user.upsert({
                        where: { username: username },
                        update: {
                            password: hashedPassword,
                            role: 'ADMIN',
                            roleProfileId: roleProfileByCode.ADMIN.id,
                            fullName: 'System Admin',
                            isActive: true
                        },
                        create: {
                            username: username,
                            password: hashedPassword,
                            role: 'ADMIN',
                            roleProfileId: roleProfileByCode.ADMIN.id,
                            fullName: 'System Admin',
                            isActive: true
                        }
                    })];
                case 9:
                    admin = _d.sent();
                    console.log("Admin user seeded: ".concat(admin.username));
                    reportTemplateTexts = [
                        {
                            name: 'Phổi bình thường',
                            modality: 'DX',
                            bodyPart: 'CHEST',
                            shortcut: '/phoi',
                            findings: 'Bóng tim không to. Hai phế trường sáng. Không thấy tổn thương nhu mô/ke khu trú. Không tràn dịch, tràn khí màng phổi.',
                            conclusion: 'Tim phổi trong giới hạn bình thường.',
                            recommendation: '',
                            isNormal: true,
                            isActive: true,
                            scope: 'GLOBAL'
                        },
                        {
                            name: 'Siêu âm ổ bụng tổng quát bình thường',
                            modality: 'US',
                            bodyPart: 'ABDOMEN',
                            shortcut: '/sab',
                            findings: 'Gan không to, nhu mô đều. Đường mật trong gan không giãn. Túi mật không sỏi. Tụy, lách, hai thận chưa ghi nhận bất thường. Không thấy dịch tự do ổ bụng.',
                            conclusion: 'Siêu âm ổ bụng chưa ghi nhận bất thường.',
                            recommendation: '',
                            isNormal: true,
                            isActive: true,
                            scope: 'GLOBAL'
                        }
                    ];
                    _c = 0, reportTemplateTexts_1 = reportTemplateTexts;
                    _d.label = 10;
                case 10:
                    if (!(_c < reportTemplateTexts_1.length)) return [3 /*break*/, 14];
                    template = reportTemplateTexts_1[_c];
                    return [4 /*yield*/, prisma.reportTemplateText.findFirst({
                            where: {
                                shortcut: template.shortcut,
                                modality: template.modality,
                                scope: 'GLOBAL'
                            }
                        })];
                case 11:
                    existing = _d.sent();
                    if (!!existing) return [3 /*break*/, 13];
                    return [4 /*yield*/, prisma.reportTemplateText.create({ data: template })];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13:
                    _c++;
                    return [3 /*break*/, 10];
                case 14:
                    console.log("Report text templates seeded: ".concat(reportTemplateTexts.length));
                    return [4 /*yield*/, prisma.clinicProfile.findFirst()];
                case 15:
                    existingClinicProfile = _d.sent();
                    if (!!existingClinicProfile) return [3 /*break*/, 17];
                    return [4 /*yield*/, prisma.clinicProfile.create({
                            data: {
                                name: 'Mini PACS',
                                legalName: 'Mini PACS Diagnostic Imaging',
                                address: '',
                                phone: '',
                                email: '',
                                website: '',
                                headerText: 'Hệ thống chẩn đoán hình ảnh',
                                footerText: 'Phiếu kết quả được phát hành từ hệ thống Mini PACS.',
                                licenseNumber: '',
                                defaultReportLanguage: 'vi'
                            }
                        })];
                case 16:
                    _d.sent();
                    console.log('Clinic profile seeded: Mini PACS');
                    _d.label = 17;
                case 17: return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
