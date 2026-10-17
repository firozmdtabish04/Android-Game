class_name SaveManager
extends RefCounted

const SAVE_PATH = "user://mitti_run_save.json"

static func load_save_data() -> Dictionary:
	var default_data = {
		"high_score": 0,
		"total_coins": 0,
		"unlocked_characters": ["birju"],
		"selected_character": "birju",
		"sound_enabled": true,
		"music_enabled": true,
		"runs_played": 0
	}
	
	if not FileAccess.file_exists(SAVE_PATH):
		return default_data
		
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return default_data
		
	var json_text = file.get_as_text()
	file.close()
	
	var json = JSON.new()
	var parse_result = json.parse(json_text)
	if parse_result != OK:
		return default_data
		
	var loaded_dict = json.get_data()
	if typeof(loaded_dict) == TYPE_DICTIONARY:
		for key in default_data.keys():
			if not loaded_dict.has(key):
				loaded_dict[key] = default_data[key]
		return loaded_dict
		
	return default_data

static func save_data(data: Dictionary) -> bool:
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if not file:
		return false
	var json_string = JSON.stringify(data, "\t")
	file.store_string(json_string)
	file.close()
	return true
