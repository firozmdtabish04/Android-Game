extends Control

## MITTI RUN - Main Menu Controller

@onready var play_button: Button = $VBoxContainer/PlayButton
@onready var shop_button: Button = $VBoxContainer/ShopButton
@onready var sound_button: Button = $VBoxContainer/SoundButton
@onready var high_score_label: Label = $Header/HighScoreLabel
@onready var total_coins_label: Label = $Header/TotalCoinsLabel

signal open_shop_requested

func _ready() -> void:
	if play_button:
		play_button.pressed.connect(_on_play_pressed)
	if shop_button:
		shop_button.pressed.connect(_on_shop_pressed)
	if sound_button:
		sound_button.pressed.connect(_on_sound_toggled)
		
	update_display()

func update_display() -> void:
	if high_score_label:
		high_score_label.text = "BEST: " + str(GameManager.get_high_score())
	if total_coins_label:
		total_coins_label.text = "₹ " + str(GameManager.get_total_coins())
	if sound_button:
		sound_button.text = "SOUND: " + ("ON" if AudioManager.sound_enabled else "OFF")

func _on_play_pressed() -> void:
	AudioManager.play_click()
	GameManager.start_game()

func _on_shop_pressed() -> void:
	AudioManager.play_click()
	open_shop_requested.emit()

func _on_sound_toggled() -> void:
	var new_state = not AudioManager.sound_enabled
	AudioManager.set_sound(new_state)
	AudioManager.set_music(new_state)
	GameManager.save_data["sound_enabled"] = new_state
	GameManager.save_data["music_enabled"] = new_state
	GameManager._save_persistent_data()
	AudioManager.play_click()
	update_display()
