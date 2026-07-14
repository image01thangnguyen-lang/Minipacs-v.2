"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Upload, Select, message, Spin, Typography, Space, App, Card, Col, Row, Divider } from "antd";
import { BankOutlined, UploadOutlined, SaveOutlined, PictureOutlined, EnvironmentOutlined, GlobalOutlined, PhoneOutlined, MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { getClinicProfile, saveClinicProfileAction } from "./actions";

const { Text, Title } = Typography;

export function ClinicProfileAntd() {
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message: antdMessage } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getClinicProfile();
      setProfile(data || {});
      form.setFieldsValue({
        name: data?.name || "Mini PACS",
        legalName: data?.legalName || "",
        address: data?.address || "",
        phone: data?.phone || "",
        email: data?.email || "",
        website: data?.website || "",
        licenseNumber: data?.licenseNumber || "",
        defaultReportLanguage: data?.defaultReportLanguage || "vi",
        headerText: data?.headerText || "",
        footerText: data?.footerText || "",
      });
    } catch (err: any) {
      antdMessage.error(err.message || "Không tải được thông tin phòng khám.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Thông tin phòng khám";
    loadData();
  }, []);

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.legalName) formData.append("legalName", values.legalName);
      if (values.address) formData.append("address", values.address);
      if (values.phone) formData.append("phone", values.phone);
      if (values.email) formData.append("email", values.email);
      if (values.website) formData.append("website", values.website);
      if (values.licenseNumber) formData.append("licenseNumber", values.licenseNumber);
      if (values.defaultReportLanguage) formData.append("defaultReportLanguage", values.defaultReportLanguage);
      if (values.headerText) formData.append("headerText", values.headerText);
      if (values.footerText) formData.append("footerText", values.footerText);

      if (values.logo && values.logo.length > 0 && values.logo[0].originFileObj) {
        formData.append("logo", values.logo[0].originFileObj);
      } else if (profile.logoPath === null && (!values.logo || values.logo.length === 0)) {
        formData.append("removeLogo", "true");
      }

      if (values.favicon && values.favicon.length > 0 && values.favicon[0].originFileObj) {
        formData.append("favicon", values.favicon[0].originFileObj);
      } else if (profile.faviconPath === null && (!values.favicon || values.favicon.length === 0)) {
         formData.append("removeFavicon", "true");
      }

      const saved = await saveClinicProfileAction(formData);
      setProfile(saved || {});
      antdMessage.success("Đã lưu thông tin phòng khám.");
    } catch (err: any) {
      antdMessage.error(err.message || "Không lưu được thông tin phòng khám.");
    } finally {
      setSaving(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const handleRemoveLogo = () => setProfile({ ...profile, logoPath: null });
  const handleRemoveFavicon = () => setProfile({ ...profile, faviconPath: null });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spin /></div>;

  return (
    <div style={{ padding: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 600px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BankOutlined /> Thông tin phòng khám
          </h2>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Logo, tên đơn vị, địa chỉ và footer dùng khi in phiếu kết quả.
          </Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card size="small" style={{ marginBottom: '16px' }}>
             <Row gutter={16}>
                <Col span={12}>
                   <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true }]}>
                      <Input placeholder="Tên phòng khám" prefix={<BankOutlined style={{ color: "rgba(255,255,255,0.2)" }}/>} />
                   </Form.Item>
                </Col>
                <Col span={12}>
                   <Form.Item name="legalName" label="Tên pháp lý">
                      <Input placeholder="Tên công ty/đơn vị nếu khác" prefix={<SafetyCertificateOutlined style={{ color: "rgba(255,255,255,0.2)" }}/>} />
                   </Form.Item>
                </Col>
             </Row>
             <Form.Item name="address" label="Địa chỉ">
                <Input placeholder="Địa chỉ phòng khám" prefix={<EnvironmentOutlined style={{ color: "rgba(255,255,255,0.2)" }}/>} />
             </Form.Item>
             <Row gutter={16}>
                <Col span={8}>
                   <Form.Item name="phone" label="Điện thoại">
                      <Input prefix={<PhoneOutlined style={{ color: "rgba(255,255,255,0.2)" }}/>} />
                   </Form.Item>
                </Col>
                <Col span={8}>
                   <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
                      <Input prefix={<MailOutlined style={{ color: "rgba(255,255,255,0.2)" }}/>} />
                   </Form.Item>
                </Col>
                <Col span={8}>
                   <Form.Item name="website" label="Website">
                      <Input prefix={<GlobalOutlined style={{ color: "rgba(255,255,255,0.2)" }}/>} />
                   </Form.Item>
                </Col>
             </Row>
             <Row gutter={16}>
                <Col span={12}>
                   <Form.Item name="licenseNumber" label="Số giấy phép">
                      <Input />
                   </Form.Item>
                </Col>
                <Col span={12}>
                   <Form.Item name="defaultReportLanguage" label="Ngôn ngữ mặc định">
                      <Select options={[{ value: "vi", label: "Tiếng Việt" }, { value: "en", label: "English" }]} />
                   </Form.Item>
                </Col>
             </Row>
          </Card>

          <Card size="small" style={{ marginBottom: '16px' }}>
             <Row gutter={24}>
               <Col span={12}>
                 <Form.Item label="Logo phòng khám" extra="JPG, PNG, WEBP hoặc GIF. Nếu không chọn file mới, logo hiện tại được giữ nguyên.">
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '60px', border: '1px solid #434343', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: '4px' }}>
                        {profile.logoPath ? <img src={profile.logoPath} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}/> : <PictureOutlined style={{ fontSize: '24px', color: '#ccc' }}/>}
                      </div>
                      <div style={{ flex: 1 }}>
                         <Form.Item name="logo" valuePropName="fileList" getValueFromEvent={normFile} noStyle>
                           <Upload maxCount={1} beforeUpload={() => false} accept="image/jpeg,image/png,image/webp,image/gif">
                             <Button icon={<UploadOutlined />} size="small">Chọn Logo</Button>
                           </Upload>
                         </Form.Item>
                         {profile.logoPath && (
                            <Button type="link" danger size="small" onClick={handleRemoveLogo} style={{ marginTop: '8px', padding: 0 }}>Xóa Logo</Button>
                         )}
                      </div>
                    </div>
                 </Form.Item>
               </Col>
               <Col span={12}>
                 <Form.Item label="Favicon trình duyệt" extra="Khuyên dùng ICO hoặc PNG vuông. Sẽ dùng Logo nếu để trống.">
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '60px', height: '60px', border: '1px solid #434343', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: '4px' }}>
                        {profile.faviconPath ? <img src={profile.faviconPath} alt="Favicon" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}/> : profile.logoPath ? <img src={profile.logoPath} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', opacity: 0.5 }}/> : <PictureOutlined style={{ fontSize: '24px', color: '#ccc' }}/>}
                      </div>
                      <div style={{ flex: 1 }}>
                         <Form.Item name="favicon" valuePropName="fileList" getValueFromEvent={normFile} noStyle>
                           <Upload maxCount={1} beforeUpload={() => false} accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon">
                             <Button icon={<UploadOutlined />} size="small">Chọn Favicon</Button>
                           </Upload>
                         </Form.Item>
                         {profile.faviconPath && (
                            <Button type="link" danger size="small" onClick={handleRemoveFavicon} style={{ marginTop: '8px', padding: 0 }}>Xóa Favicon</Button>
                         )}
                      </div>
                    </div>
                 </Form.Item>
               </Col>
             </Row>
          </Card>

          <Card size="small" style={{ marginBottom: '16px' }}>
             <Form.Item name="headerText" label="Header phụ trên phiếu">
                <Input.TextArea rows={3} placeholder="Ví dụ: Hệ thống chẩn đoán hình ảnh" />
             </Form.Item>
             <Form.Item name="footerText" label="Footer trên phiếu" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={3} placeholder="Thông tin hotline, lưu ý pháp lý hoặc hướng dẫn nhận kết quả." />
             </Form.Item>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
               Lưu thông tin
             </Button>
          </div>
        </Form>
      </div>

      <div style={{ flex: '1 1 400px', maxWidth: '600px' }}>
        <Card title="Preview header phiếu in" size="small" style={{ height: '100%', backgroundColor: '#141414' }}>
           <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '4px', color: '#000' }}>
             <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div style={{ width: '100px', height: '60px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px' }}>
                  {profile.logoPath ? <img src={profile.logoPath} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}/> : <PictureOutlined style={{ fontSize: '24px', color: '#cbd5e1' }}/>}
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' }}>{profile.name}</div>
                   {profile.legalName && <div style={{ fontWeight: 600, fontSize: '12px', color: '#475569' }}>{profile.legalName}</div>}
                   {profile.headerText && <div style={{ marginTop: '4px', fontSize: '12px', color: '#475569' }}>{profile.headerText}</div>}
                   <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {profile.address && <div>{profile.address}</div>}
                      <div>{[profile.phone, profile.email, profile.website].filter(Boolean).join(" · ") || "Chưa cấu hình liên hệ"}</div>
                      {profile.licenseNumber && <div>Giấy phép: {profile.licenseNumber}</div>}
                   </div>
                </div>
             </div>
             
             <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>Kết quả chẩn đoán hình ảnh</div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>Nội dung phiếu bệnh nhân sẽ hiển thị tại đây.</div>
             </div>
             
             <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '11px', color: '#64748b' }}>
                {profile.footerText || "Chưa cấu hình footer phiếu in."}
             </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
