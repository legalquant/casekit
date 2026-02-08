mod commands;
mod models;
pub mod path_safety;
pub mod extraction;
pub mod date_scanner;
pub mod ocr;

use commands::case::{create_case, list_cases, load_case, update_case, delete_case};
use commands::documents::{add_document_metadata, copy_file_to_case, list_case_files, load_documents_index, remove_document_metadata, read_file_text, extract_text_from_path};
use commands::chronology::{build_chronology, add_chronology_entry, remove_chronology_entry, update_chronology_entry, scan_documents_for_dates};
use commands::export::export_bundle;
use commands::filesystem::{get_base_path, ensure_base_directory};
use commands::system::check_dependencies;
use commands::ai_history::{save_ai_call, load_ai_history};
use commands::citation::{
    check_urls_exist, resolve_citation, search_bailii_cases, search_fcl_cases,
    fetch_judgment, save_authority, load_authorities, remove_authority,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_base_path,
            ensure_base_directory,
            create_case,
            list_cases,
            load_case,
            update_case,
            delete_case,
            copy_file_to_case,
            list_case_files,
            read_file_text,
            load_documents_index,
            add_document_metadata,
            remove_document_metadata,
            extract_text_from_path,
            build_chronology,
            add_chronology_entry,
            remove_chronology_entry,
            update_chronology_entry,
            scan_documents_for_dates,
            export_bundle,
            check_dependencies,
            save_ai_call,
            load_ai_history,
            // Citation resolution & legal research
            check_urls_exist,
            resolve_citation,
            search_bailii_cases,
            search_fcl_cases,
            fetch_judgment,
            save_authority,
            load_authorities,
            remove_authority,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

