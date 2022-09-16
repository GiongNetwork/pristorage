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

const validationSchema = Yup.object().shape({
    account: Yup.string().required('Invalid account id'),
    permissions: Yup.number().required('Invalid permission'),
});

const {Option} = Select

const ShareFileButton = (props) => {

    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)

    const accountFormik = useFormik({
        initialValues: {
            account: '',
            permissions: ''
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            setLoading(true)
            const user = await window.contract.get_user({account_id: values.account})
            if (!user) {
                message.error(`User "${values.account}" not found`)
                return
            }
            const {plaintext, success: decryptStatus} = await decryptStringTypeData(userCurrent.privateKey, props.encrypted_password)
            if (!decryptStatus) {
                message.error(`Wrong user password`)
                return
            }
            const {public_key} = user
            const {cipher, success} = await encryptStringTypeData(public_key, plaintext)
            if (!success) {
                message.error(`Fail to encrypt password`)
                return
            }
            const current = new Date().getTime()
            const params = {
                _file_id: props.id, 
                _share_with: values.account, 
                _parent_folder: props.folder, 
                _password: cipher,
                _permissions: values.permissions,
                _created_at: current
            }
            const data = await window.contract.share_file_v2(params)
            setIsModalShareVisible(false)
            message.success(`Share file success with account ${values.account}!!!`)
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
        accountFormik.resetForm()
    };

    return (
        <>
        <Tooltip title="Share file">
            <Button onClick={showModalShare} className="mx-1">
                <ShareAltOutlined />
            </Button>
        </Tooltip>
        <Modal 
            title="Share file" 
            visible={isModalShareVisible} 
            onOk={handleSubmit} 
            onCancel={handleCancelShare}
            confirmLoading={loading}
            cancelButtonProps={{disabled: loading}}
            maskClosable={false}
        >
            <div className="input-group mb-3">
                <label className="form-label">Share with</label>
                <Input placeholder="Account id" value={values.account || ''} onChange={handleChange('account')} />
            </div>
            {errors.account && touched.account && <span className="error-text">{errors.account}</span>}
            
            <div className="input-group mb-3">
                <label className="form-label">Permission</label>
                <Select style={{ width: '100%' }} placeholder="Permission" value={values.permissions.toString() || []} onChange={(val) => setFieldValue('permissions', parseInt(val))}>
                    <Option value="1">Read only</Option>
                    {/* <Option value="2">Edit</Option> */}
                </Select>
            </div>
            {errors.permissions && touched.permissions && <span className="error-text">{errors.permissions}</span>}
        </Modal>
        </>
    )
}

export default ShareFileButton;