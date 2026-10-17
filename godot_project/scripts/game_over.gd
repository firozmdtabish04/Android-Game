extends Control

## MITTI RUN - Game Over Controller ("Khel Khatam")

@onready var final_score_label: Label = $Panel/VBoxContainer/ScoreLabel
@onready var best_score_label: Label = $Panel/VBoxContainer/BestLabel
@onready var coins_earned_label: Label = $Panel/VBoxContainer/CoinsLabel
@onready var new_best_banner: Label = $Panel/VBoxContainer/NewBestBanner
@onready var retry_button: Button = $Panel/VBoxContainer/Buttons/RetryButton
@onready var menu_button: Button = $Panel/VBoxContainer/Buttons/MenuButton

func _ready() -> void:
	if retry_button:
		retry_button.pressed.connect(_on_retry_pressed)
	if menu_button:
		menu_button.pressed.connect(_on_menu_pressed)

func show_game_over() -> void:
	var final_score = GameManager.current_score
	var high_score = GameManager.get_high_score()
	var coins = GameManager.run_coins
	
	if final_score_label:
		final_score_label.text = "SCORE: " + str(final_score)
	if best_score_label:
		best_score_label.text = "RECORD: " + str(high_score)
	if coins_earned_label:
		coins_earned_label.text = "COINS: +₹ " + str(coins)
		
	if new_best_banner:
		new_best_banner.visible = (final_score >= high_score and final_score > 0)
		
	visible = true

func _on_retry_pressed() -> void:
	AudioManager.play_click()
	visible = false
	# Reload current scene to clean up chunks
	get_tree().reload_current_scene()
	GameManager.start_game()

func _on_menu_pressed() -> void:
	AudioManager.play_click()
	visible = false
	get_tree().reload_current_scene()
	GameManager.return_to_menu()
