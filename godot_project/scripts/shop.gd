extends Control

## MITTI RUN - Character Shop Controller

@onready var close_button: Button = $CloseButton
@onready var coins_display: Label = $TopBar/CoinsLabel

# Character 1: Birju
@onready var birju_btn: Button = $Scroll/Grid/BirjuCard/SelectButton
@onready var birju_status: Label = $Scroll/Grid/BirjuCard/StatusLabel

# Character 2: Lallan
@onready var lallan_btn: Button = $Scroll/Grid/LallanCard/SelectButton
@onready var lallan_status: Label = $Scroll/Grid/LallanCard/StatusLabel

# Character 3: Champa
@onready var champa_btn: Button = $Scroll/Grid/ChampaCard/SelectButton
@onready var champa_status: Label = $Scroll/Grid/ChampaCard/StatusLabel

signal shop_closed

func _ready() -> void:
	if close_button:
		close_button.pressed.connect(_on_close_pressed)
		
	if birju_btn: birju_btn.pressed.connect(func(): _on_char_button_pressed("birju"))
	if lallan_btn: lallan_btn.pressed.connect(func(): _on_char_button_pressed("lallan"))
	if champa_btn: champa_btn.pressed.connect(func(): _on_char_button_pressed("champa"))
	
	refresh_shop()

func refresh_shop() -> void:
	if coins_display:
		coins_display.text = "₹ " + str(GameManager.get_total_coins())
		
	var selected = GameManager.get_selected_character()
	_update_card("birju", birju_btn, birju_status, selected)
	_update_card("lallan", lallan_btn, lallan_status, selected)
	_update_card("champa", champa_btn, champa_status, selected)

func _update_card(char_id: String, btn: Button, status: Label, selected: String) -> void:
	if not btn or not status:
		return
	var char_info = GameManager.CHARACTERS[char_id]
	var unlocked = char_info["unlocked"]
	var cost = char_info["cost"]
	
	if selected == char_id:
		status.text = "SELECTED"
		btn.text = "ACTIVE"
		btn.disabled = true
	elif unlocked:
		status.text = "UNLOCKED"
		btn.text = "CHOOSE"
		btn.disabled = false
	else:
		status.text = "₹ " + str(cost)
		btn.text = "UNLOCK"
		btn.disabled = (GameManager.get_total_coins() < cost)

func _on_char_button_pressed(char_id: String) -> void:
	AudioManager.play_click()
	var char_info = GameManager.CHARACTERS[char_id]
	if char_info["unlocked"]:
		GameManager.select_character(char_id)
	else:
		var success = GameManager.unlock_character(char_id)
		if success:
			AudioManager.play_powerup()
	refresh_shop()

func _on_close_pressed() -> void:
	AudioManager.play_click()
	visible = false
	shop_closed.emit()
