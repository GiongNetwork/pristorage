import React from 'react';
import { 
    Button, 
    Modal, 
    Tooltip
} from 'antd'
import {
    DeleteOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons'
import { useHistory } from 'react-router-dom'
const { confirm } = Modal

const DeleteButton = (props) => {

    const history = useHistory()
    const {type, handleDelete, name} = props;

    const showConfirm = () => {
        confirm({
            title: `Do you want to delete this ${type}?`,
            icon: <ExclamationCircleOutlined />,
            content: name,
            onOk() {
                handleDelete()
            },
            onCancel() {
            },
        });
    }

    return (
        <>
        <Tooltip title="Remove">
            <Button danger onClick={showConfirm} className="mx-1">
                <DeleteOutlined />
            </Button>
        </Tooltip>
        </>
    )
}

export default DeleteButton