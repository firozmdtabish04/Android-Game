extends Node

## MITTI RUN - Game Manager AutoLoad
## Manages game lifecycle, score, distance, coins, power-ups, and persistence.

signal score_updated(new_score: int)
signal distance_updated(new_distance: float)
signal coins_updated(run_coins: int, total_coins: int)
signal powerup_started(powerup_type: String, duration: float)
signal powerup_ended(powerup_type: String)
signal game_state_changed(new_state: int)
signal player_crashed()

enum GameState {
	MENU,
	PLAYING,
	PAUSED,
	GAME_OVER
}

var current_state: GameState = GameState.MENU

# In-run stats
var current_score: int = 0
var current_distance: float = 0.0
var run_coins: int = 0
var current_speed: float = 14.0
const BASE_SPEED: float = 14.0
const MAX_SPEED: float = 28.0
const SPEED_INCREMENT: float = 0.003

# Powerup active durations
var magnet_timer: float = 0.0
var shield_active: bool = false
var boost_timer: float = 0.0

# Persistent data
var save_data: Dictionary = {}

# Characters catalog
var CHARACTERS: Dictionary = {
	"birju": {
		"name": "Birju",
		"tagline": "The Village Sprinter",
		"cost": 0,
		"color": Color(0.9, 0.3, 0.1), # Terracotta / Saffron
		"dhoti_color": Color(0.95, 0.95, 0.9),
		"unlocked": true
	},
	"lallan": {
		"name": "Lallan",
		"tagline": "The Daring Auto Driver",
		"cost": 150,
		"color": Color(0.15, 0.65, 0.25), # Bihar Rickshaw Green
		"dhoti_color": Color(0.95, 0.8, 0.1),
		"unlocked": false
	},
	"champa": {
		"name": "Champa",
		"tagline": "The Fast Runner",
		"cost": 300,
		"color": Color(0.85, 0.15, 0.45), # Vibrant Desi Pink
		"dhoti_color": Color(0.2, 0.5, 0.8),
		"unlocked": false
	}
}

const SaveManagerClass = preload("res://scripts/save_manager.gd")

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_persistent_data()

func _load_persistent_data() -> void:
	save_data = SaveManagerClass.load_save_data()
	for char_id in save_data.get("unlocked_characters", ["birju"]):
		if CHARACTERS.has(char_id):
			CHARACTERS[char_id]["unlocked"] = true
	
	AudioManager.set_sound(save_data.get("sound_enabled", true))
	AudioManager.set_music(save_data.get("music_enabled", true))

func _save_persistent_data() -> void:
	SaveManagerClass.save_data(save_data)

func _process(delta: float) -> void:
	if current_state == GameState.PLAYING:
		# Gradually increase speed over distance
		var speed_mult = 1.6 if boost_timer > 0.0 else 1.0
		var eff_speed = current_speed * speed_mult
		current_speed = min(current_speed + SPEED_INCREMENT * delta * 60.0, MAX_SPEED)
		
		# Distance and score
		current_distance += eff_speed * delta
		current_score = int(current_distance) + (run_coins * 10)
		
		distance_updated.emit(current_distance)
		score_updated.emit(current_score)
		
		# Manage power-up timers
		if magnet_timer > 0.0:
			magnet_timer -= delta
			if magnet_timer <= 0.0:
				powerup_ended.emit("magnet")
				
		if boost_timer > 0.0:
			boost_timer -= delta
			if boost_timer <= 0.0:
				powerup_ended.emit("boost")

func start_game() -> void:
	current_score = 0
	current_distance = 0.0
	run_coins = 0
	current_speed = BASE_SPEED
	magnet_timer = 0.0
	shield_active = false
	boost_timer = 0.0
	
	current_state = GameState.PLAYING
	game_state_changed.emit(current_state)
	coins_updated.emit(run_coins, get_total_coins())

func pause_game() -> void:
	if current_state == GameState.PLAYING:
		current_state = GameState.PAUSED
		game_state_changed.emit(current_state)

func resume_game() -> void:
	if current_state == GameState.PAUSED:
		current_state = GameState.PLAYING
		game_state_changed.emit(current_state)

func trigger_game_over() -> void:
	if current_state == GameState.PLAYING:
		current_state = GameState.GAME_OVER
		AudioManager.play_crash()
		player_crashed.emit()
		
		# Update persistent stats
		var prev_high = save_data.get("high_score", 0)
		var is_new_high = current_score > prev_high
		if is_new_high:
			save_data["high_score"] = current_score
			
		save_data["total_coins"] = save_data.get("total_coins", 0) + run_coins
		save_data["runs_played"] = save_data.get("runs_played", 0) + 1
		_save_persistent_data()
		
		game_state_changed.emit(current_state)

func return_to_menu() -> void:
	current_state = GameState.MENU
	game_state_changed.emit(current_state)

func add_coin() -> void:
	run_coins += 1
	AudioManager.play_coin()
	coins_updated.emit(run_coins, get_total_coins() + run_coins)

func activate_magnet(duration: float = 10.0) -> void:
	magnet_timer = duration
	AudioManager.play_powerup()
	powerup_started.emit("magnet", duration)

func activate_shield() -> void:
	shield_active = true
	AudioManager.play_powerup()
	powerup_started.emit("shield", 999.0)

func activate_boost(duration: float = 6.0) -> void:
	boost_timer = duration
	AudioManager.play_powerup()
	powerup_started.emit("boost", duration)

func consume_shield() -> bool:
	if shield_active:
		shield_active = false
		AudioManager.play_crash()
		powerup_ended.emit("shield")
		return true
	return false

func is_boosted() -> bool:
	return boost_timer > 0.0

func is_magnet_active() -> bool:
	return magnet_timer > 0.0

func get_high_score() -> int:
	return save_data.get("high_score", 0)

func get_total_coins() -> int:
	return save_data.get("total_coins", 0)

func get_selected_character() -> String:
	return save_data.get("selected_character", "birju")

func select_character(char_id: String) -> bool:
	if CHARACTERS.has(char_id) and CHARACTERS[char_id]["unlocked"]:
		save_data["selected_character"] = char_id
		_save_persistent_data()
		return true
	return false

func unlock_character(char_id: String) -> bool:
	if not CHARACTERS.has(char_id):
		return false
	var cost = CHARACTERS[char_id]["cost"]
	var total = get_total_coins()
	if total >= cost and not CHARACTERS[char_id]["unlocked"]:
		save_data["total_coins"] = total - cost
		var unlocked_list: Array = save_data.get("unlocked_characters", ["birju"])
		if not unlocked_list.has(char_id):
			unlocked_list.append(char_id)
		save_data["unlocked_characters"] = unlocked_list
		CHARACTERS[char_id]["unlocked"] = true
		save_data["selected_character"] = char_id
		_save_persistent_data()
		coins_updated.emit(run_coins, get_total_coins())
		return true
	return false
