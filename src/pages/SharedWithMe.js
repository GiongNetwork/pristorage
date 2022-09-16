import React, {useState, useEffect} from 'react'
import './style/General.page.css'
import {
    DownloadOutlined,
    FolderOpenOutlined,
    FileProtectOutlined,
    FolderAddOutlined,
    UploadOutlined,
    InboxOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { 
    Table, 
    Tabs,
    Tooltip,
    Button,
    Input,
    Modal,
    Upload,
    message,
    Spin, 
} from 'antd';
import { 
    useSelector, 
} from 'react-redux';
import {
    encryptStringTypeData,
} from '../utils/keypair.utils'
import {useHistory} from 'react-router-dom'
import {useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import useFetchSharedDocs from '../hook/useFetchSharedDoc'
import useFileCreate from '../hook/useFileCreate'
import useDownloadFile from '../hook/useDownloadFile'
import useFilePreview from '../hook/useFilePreview'

const { Dragger } = Upload;

const folderValidationSchema = Yup.object().shape({
    name: Yup.string().required('Invalid folder name'),
});

export default function SharedWithMe() {
    const [loading, setLoading] = useState(false)
    const [newFolderId, setNewFolderId] = useState('')
    const [upLoadDisable, setUpLoadDisable] = useState(false)
    const [file, setFile] = useState({})
    const history = useHistory()

    const [data, setData] = useState([])
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)
    const {
        loading: folderLoading, 
        current: folderCurrent, 
        root: rootFolder,
        folderId: currentFolderId,
        parentFolder,
        permission
    } = useSelector(state => state.sharedWithMe)
    const {loading: submitting, fileSubmit} = useFileCreate()
    const {loading: downloading, download} = useDownloadFile()
    useFetchSharedDocs(newFolderId, setNewFolderId)
    const {
        preview
    } = useFilePreview()
    
    const formik = useFormik({
        initialValues: {
            name: '',
        },
        validationSchema: folderValidationSchema,
        onSubmit: async (values) => {
            setLoading(true)
            const currentTimeStamp = new Date().getTime()
            const id = uuidv4()
            const {accountId} = await window.walletConnection.account()
            const folder = {
                _id: id, 
                _name: values.name, 
                _parent: currentFolderId,
                _password: null,
                _created_at: currentTimeStamp,
                _type: null,
            }
            await window.contract.create_folder_v2(folder)
            setIsModalCreateFolderVisible(false)
            message.success("Folder created!!!")
            setNewFolderId(folder._id)
            setLoading(false)
            formik.resetForm()
            // history.go(0)
        }
    })

    const {values, errors, touched, handleChange, handleSubmit, setFieldValue} = formik

    const [isModalCreateFolderVisible, setIsModalCreateFolderVisible] = useState(false);
    const [isModalUploadVisible, setIsModalUploadVisible] = useState(false);

    const showModalCreateFolder = () => {
        setIsModalCreateFolderVisible(true);
    };
    
    const handleCancelCreateFolder = () => {
        setIsModalCreateFolderVisible(false);
        formik.resetForm()
    };

    const showModalUpload = () => {
        setIsModalUploadVisible(true);
    };
    
    const handleUpload = () => {
        setIsModalUploadVisible(false);
    };

    const handleUploadFile = async() => {
        setLoading(true)
        await fileSubmit(file, rootFolder, currentFolderId)
        message.success('Upload success!!!')
        setIsModalUploadVisible(false)
        setLoading(false)
        // setNewFolderId('')
    }
    
    const handleCancelUpload = () => {
        setIsModalUploadVisible(false);
    };

    const props = {
        name: 'file',
        multiple: false,
        onChange(info) {
            const { status } = info.file;
            if (status !== 'uploading') {
                setLoading(true)
                fileSubmit(file, rootFolder, currentFolderId)
            }
        },
        onDrop(e) {
            console.log('Dropped files', e.dataTransfer.files);
            fileSubmit(e.dataTransfer.files[0])
        },
        showUploadList: {
            showRemoveIcon: false,
        }
    };

    const redirectToFolder = (id) => {
        if (!id || id === rootFolder?.parent) {
            history.push(`/shared_with_me`)
            setNewFolderId('')
            // history.go(0)
        } else {
            history.push(`/shared_with_me?doc_id=${id}`)
            setNewFolderId(id)
            // history.go(0)
        }
    }

    const downloadFile = async (record) => {
        const {cid, encrypted_password, name, file_type} = record
        if (encrypted_password) {
            download(cid, encrypted_password, name, file_type)
        } else if (rootFolder?.folder_password) {
            const {folder_password} = rootFolder
            download(cid, folder_password, name, file_type)
        } else {
            message.error('download error, invalid file')
        }
    }

    const previewFile = async (record) => {
        const {cid, encrypted_password, name, file_type} = record
        if (encrypted_password) {
            preview(cid, encrypted_password, name, file_type)
        } else if (rootFolder?.folder_password) {
            const {folder_password} = rootFolder
            preview(cid, folder_password, name, file_type)
        } else {
            message.error('download error, invalid file')
        }
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            render(text, record) {
                return (
                    <div>
                        {record.isFolder  ? 
                            <a onClick={() => redirectToFolder(record.id)}>{!record.isTop && <FolderOpenOutlined />} {record.name}</a>:
                            <a onClick={() => previewFile(record)}><FileProtectOutlined /> {record.name}</a>
                        }
                    </div>
                )
            }
        },
        {
            title: 'Type',
            dataIndex: 'file_type',
        },
        {
            title: '',
            render(text, record) {
                return (
                    <div>
                        {!record.isFolder && !record.isTop && <div className="d-flex" style={{float:"right"}}>
                            <Tooltip title="Download">
                                <Button
                                    onClick={async () => downloadFile(record)}
                                    className='mx-1'
                                >
                                    <DownloadOutlined />
                                </Button>
                            </Tooltip>
                        </div>}
                    </div>
                )
            }
        },
    ];
    const fileUploading = loading ? <Spin tip='File Uploading' spinning={loading}></Spin>:"Click or drag file to this area to upload"

    return (
        <>
        <div>
            <div className="header">
                <h2 className="title">Shared with me</h2>
                <hr />
            </div>
            <div className="content">
                {permission === 2  && <div className="actions d-flex justify-content-end">
                    <div className="action-button">
                        <Tooltip title='Create folder'>
                            <Button 
                                icon={<FolderAddOutlined style={{ fontSize: '18px' }} />} 
                                onClick={showModalCreateFolder} 
                            >
                                Create folder
                            </Button>
                        </Tooltip>
                        <Modal 
                            title="Create folder" 
                            visible={isModalCreateFolderVisible} 
                            onOk={handleSubmit} 
                            onCancel={handleCancelCreateFolder}
                            confirmLoading={loading}
                            maskClosable={false}
                            cancelButtonProps={{disabled: loading}}
                        >
                            <label className="form-label">Folder name</label>
                            <div className="input-group mb-3">
                                <Input placeholder="Folder name" value={values.name || ''} onChange={handleChange('name')} />
                            </div>
                            {errors.name && touched.name && <span className="error-text">{errors.name}</span>}
                        </Modal>
                    </div>
                    <div className="action-button">
                        <Tooltip title='Upload file'>
                            <Button 
                                icon={<UploadOutlined style={{ fontSize: '18px' }} />} 
                                onClick={showModalUpload}
                            >
                                Upload file
                            </Button>
                        </Tooltip>
                        <Modal 
                            title="Upload file" 
                            visible={isModalUploadVisible} 
                            onCancel={handleCancelUpload}
                            maskClosable={false}
                            footer={[]}
                            // okText="Upload"
                            // onOk={handleUploadFile}
                            // confirmLoading={loading}
                        >
                            <Dragger {...props} disabled={upLoadDisable} beforeUpload={(inf)=> {
                                if(!!inf){
                                    setUpLoadDisable(true)
                                    setFile(inf)
                                }
                                return false
                            }}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">{fileUploading}</p>
                            </Dragger>
                        </Modal>
                    </div>
                </div>}
                <div className="list-items mt-3">
                    <div>
                        <Tooltip title="Back">
                            <Button onClick={() => redirectToFolder(parentFolder)}><ArrowLeftOutlined /></Button>
                        </Tooltip>
                    </div>
                    <div className="mt-3">
                        <Table 
                            columns={columns} 
                            dataSource={folderCurrent} 
                            rowKey={(record) => record.id} 
                        />
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
