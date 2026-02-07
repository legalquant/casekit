mod commands;
mod models;
pub mod path_safety;

use commands::case::{create_case, list_cases, load_case, update_case};
use commands::documents::{add_document_metadata, copy_file_to_case, list_case_files, remove_document_metadata, read_file_text};
use commands::chronology::{build_chronology, add_chronology_entry, remove_chronology_entry};
use commands::export::export_bundle;
use commands::filesystem::{get_base_path, ensure_base_directory};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_base_path,
            ensure_base_directory,
            create_case,
            list_cases,
            load_case,
            update_case,
            copy_file_to_case,
            list_case_files,
            read_file_text,
            add_document_metadata,
            remove_document_metadata,
            build_chronology,
            add_chronology_entry,
            remove_chronology_entry,
            export_bundle,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
