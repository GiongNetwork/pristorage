import React, {useEffect, useState} from 'react';
import {
    retrieveFiles,
} from '../utils/web3.storage'
import {concatenateBlobs, saveFile} from '../utils/file.utils'
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

const useDownloadFile = () => {

    const [loading, setLoading] = useState(false)
    const {
        root,
        folderId: currentFolderId,
    } = useSelector(state => state.folderV2)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)

    const download = async (cid, encryptedPassword, name, fileType, setDownloadId) => {
        setLoading(true)
        setDownloadId(cid)

        const {plaintext, success} = await decryptStringTypeData(userCurrent.privateKey, encryptedPassword)
        if (success) {
            message.info('Downloading')
            const files = await retrieveFiles(userCurrent.web3token, cid)
            message.info('Decrypting')
            const {decryptByWorker} = wrap(worker)
            const decryptedFile = await decryptByWorker(files, name, plaintext)
            concatenateBlobs(decryptedFile, fileType, (blob) => {
                saveFile(blob, name)
                setLoading(false)
            })
        } else {
            message.error('Invalid private key')
        }
    }

    return {
        loading,
        download
    }
}

export default useDownloadFile