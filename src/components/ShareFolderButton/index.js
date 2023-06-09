import React, {useState, useEffect} from 'react';
import { 
    Button, 
    Modal, 
    Input,
    Select,
    message,
    Tooltip
} from 'antd'
import {
    ShareAltOutlined,
} from '@ant-design/icons';
import {
    getPublicKeyByPrivateKey,
    encryptStringTypeData,
    decryptStringTypeData
} from '../../utils/keypair.utils'
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';

const accountValidationSchema = Yup.object().shape({
    account: Yup.string().required('Invalid account id'),
    permissions: Yup.number().required('Invalid permission'),
});

const {Option} = Select

const ShareFolderButton = (props) => {

    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)

    const accountFormik = useFormik({
        initialValues: {
            account: '',
            permissions: ''
        },
        validationSchema: accountValidationSchema,
        onSubmit: async (values) => {
            setLoading(true)
            const user = await window.contract.get_user({account_id: values.account})
            if (!user) {
                message.error(`User "${values.account}" not found`)
                setLoading(false)
                return
            }
            const {plaintext, success} = await decryptStringTypeData(userCurrent.privateKey, props.folder_password)
            if (!success) {
                message.error(`Wrong user password`)
                setLoading(false)
                return
            }
            const {public_key} = user
            const {cipher, success: isEncryptSuccess} = await encryptStringTypeData(public_key, plaintext)
            if (!isEncryptSuccess) {
                message.error(`fail to encrypt password`)
                setLoading(false)
                return
            }
            const current = new Date().getTime()
            const params = {
                _folder_id: props.id, 
                _share_with: values.account, 
                _password: cipher,
                _permissions: values.permissions,
                _created_at: current
            }
            await window.contract.share_folder_v2(params)
            setIsModalShareVisible(false)
            message.success(`Share folder success with account ${values.account}!!!`)
            setLoading(false)
            // history.go(0)
        }
    })

    const {
        values: values, 
        errors: errors, 
        touched,
        handleChange: handleChange, 
        handleSubmit: handleSubmit, 
        setFieldValue: setFieldValue
    } = accountFormik

    const [isModalShareVisible, setIsModalShareVisible] = useState(false);

    const showModalShare = () => {
        setIsModalShareVisible(true);
    };
    
    const handleCancelShare = () => {
        setIsModalShareVisible(false);
        setLoading(false)
        accountFormik.resetForm()
    };

    return (
        <>
        <Tooltip title='Share folder'>
            <Button onClick={showModalShare}>
                <ShareAltOutlined />
            </Button>
        </Tooltip>
        <Modal 
            title="Share folder" 
            visible={isModalShareVisible} 
            onOk={handleSubmit} 
            onCancel={handleCancelShare}
            confirmLoading={loading}
            cancelButtonProps={{disabled: loading}}
            maskClosable={false}
        >
            <label className="form-label">Share with</label>
            <div className="input-group mb-3">
                <Input placeholder="Account id" value={values.account || ''} onChange={handleChange('account')} />
            </div>
            {errors.account && touched.account && <span className="error-text">{errors.account}</span>}

            <div className="input-group mb-3">
                <label className="form-label">Permission</label>
                <Select style={{ width: '100%' }} placeholder='Permission' value={values.permissions.toString() || []} onChange={(val) => setFieldValue('permissions', parseInt(val))}>
                    <Option value="1">Read only</Option>
                    <Option value="2">Edit</Option>
                </Select>
            </div>
            {errors.permissions && touched.permissions && <span className="error-text">{errors.permissions}</span>}
        </Modal>
        </>
    )
}

export default ShareFolderButton;