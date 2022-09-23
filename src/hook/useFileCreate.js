import React, {useEffect, useState} from 'react';
import {
    storeFiles
} from '../utils/web3.storage'
import {
    encryptStringTypeData,
    decryptStringTypeData
} from '../utils/keypair.utils'
import { 
    useSelector, 
} from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {wrap} from 'comlink'
import {message} from 'antd'
const worker = new Worker(new URL('../worker.js', import.meta.url), { type: "module" } )

const useFileCreate = () => {
    const [loading, setLoading] = useState(false)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)

    const storeToWeb3Storage = async (files, filename, fileType, encryptedPassword, currentFolderId, setIsModalUploadVisible) => {
        const totalSize = files.map(f => f.size).reduce((a, b) => a + b, 0)
        let uploaded = 0

        const onRootCidReady = cid => {
            console.log('upfolderLoading files with cid:', cid)
        }
    
        const onStoredChunk = size => {
            uploaded += size
            const pct = uploaded / totalSize
            console.log(`UpfolderLoading... ${pct.toFixed(2) * 100}% complete`)
        }

        const cid = await storeFiles(userCurrent.web3token, files, onRootCidReady, onStoredChunk)
        const current = new Date().getTime()
        try {
            await window.contract.create_file_v2({
                _folder: currentFolderId, 
                _file_id: uuidv4(),
                _cid: cid, 
                _name: filename, 
                _encrypted_password: encryptedPassword, 
                _file_type: fileType ,
                _created_at: current
            })
            history.go(0)
        } catch (error) {
            setLoading(false)
            message.error(error.message, 10)
            setIsModalUploadVisible(false)
        } finally {
        }       
        
    }

    const fileSubmit = async (file, root, currentFolderId, setIsModalUploadVisible, setLoading) => {
        setLoading(true)
        const {encryptByWorker} = wrap(worker)
        const {folder_type: folderType = 1,folder_password: folderPassword} = root || {}
        if (folderType === 2) {
            const {success, plaintext: folderDecryptedPassword} = await decryptStringTypeData(userCurrent.privateKey, folderPassword)
            if (success) {
                const encryptedFiles = await encryptByWorker(file, folderDecryptedPassword)
                await storeToWeb3Storage(encryptedFiles, file.name, file.type, null, currentFolderId, setIsModalUploadVisible, setLoading)
                // setIsModalUploadVisible(false)
                // history.go(0)
            } else {
                message.error("Wrong private key")
            }
        } else {
            const password = uuidv4()
            const encryptedFiles = await encryptByWorker(file, password)
            const {success, cipher} = await encryptStringTypeData(userCurrent.publicKey, password)
            if (success) {
                await storeToWeb3Storage(encryptedFiles, file.name, file.type, cipher, currentFolderId, setIsModalUploadVisible, setLoading)
                // setIsModalUploadVisible(false)
                // history.go(0)
            } else {
                message.error('Fail to encrypt file ' + file.name)
            }
        }
    }

    return {
        loading,
        fileSubmit
    }
}

export default useFileCreate