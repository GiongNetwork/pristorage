import { connect, Contract, keyStores, WalletConnection } from 'near-api-js'
import getConfig from './config'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')

export async function initContract() {
  const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))

  window.walletConnection = new WalletConnection(near)

  window.accountId = window.walletConnection.getAccountId()

  window.contract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
    viewMethods: [
      'get_user', 
      'get_folder_info', 
      'get_folder_info_v2',
      'get_shared_folder_info',
      'get_file_info',
      'get_root_shared_folder',
      'get_owner_by_folder_id',
      'get_owner_by_shared_folder_id',
      'get_shared_folders_of_user',
      'get_shared_user_of_folder',
      'get_shared_files_of_user',
      'get_shared_user_of_file',
      'get_shared_file_docs_by_owner',
      'get_shared_folder_docs_by_owner',
      'get_all_file_in_folder',
      'get_all_file_in_shared_folder',
      'get_root_id_by_shared_folder_id',
      'get_root',
      'get_shared_doc_of_user',
      'get_shared_doc_detail',
      'verify_accessible'
    ],
    changeMethods: [
      'sign_up', 
      'create_folder', 
      'create_shared_folder', 
      'create_folder_v2',
      'create_file', 
      'create_file_v2',
      'create_shared_folder_file',
      'share_file',
      'share_file_v2',
      'share_folder',
      'share_folder_v2',
      'remove_file',
      'remove_file_v2', 
      'remove_folder',
      'remove_folder_v2',
      'remove_shared_file',
      'remove_shared_folder'
    ],
  })
}

export function logout() {
  window.walletConnection.signOut()
  // reload page
  window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {
  // Allow the current app to make calls to the specified contract on the
  // user's behalf.
  // This works by creating a new access key for the user's account and storing
  // the private key in localStorage.
  window.walletConnection.requestSignIn(nearConfig.contractName)
}
