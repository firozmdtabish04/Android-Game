extends Control

## MITTI RUN - Character Shop Controller

@onready var close_button: Button = $CloseButton
@onready var coins_display: Label = $TopBar/CoinsLabel

# Character 1: Tabish
@onready var tabish_btn: Button = get_node_or_null("Scroll/Grid/TabishCard/SelectButton")
@onready var tabish_status: Label = get_node_or_null("Scroll/Grid/TabishCard/StatusLabel")

# Character 2: Akhil
@onready var akhil_btn: Button = get_node_or_null("Scroll/Grid/AkhilCard/SelectButton")
@onready var akhil_status: Label = get_node_or_null("Scroll/Grid/AkhilCard/StatusLabel")

# Character 3: Firoz
@onready var firoz_btn: Button = get_node_or_null("Scroll/Grid/FirozCard/SelectButton")
@onready var firoz_status: Label = get_node_or_null("Scroll/Grid/FirozCard/StatusLabel")

signal shop_closed

func _ready() -> void:
	if close_button:
		close_button.pressed.connect(_on_close_pressed)
		
	if tabish_btn: tabish_btn.pressed.connect(func(): _on_char_button_pressed("tabish"))
	if akhil_btn: akhil_btn.pressed.connect(func(): _on_char_button_pressed("akhil"))
	if firoz_btn: firoz_btn.pressed.connect(func(): _on_char_button_pressed("firoz"))
	
	refresh_shop()

func refresh_shop() -> void:
	if coins_display:
		coins_display.text = "₹ " + str(GameManager.get_total_coins())
		
	var selected = GameManager.get_selected_character()
	_update_card("tabish", tabish_btn, tabish_status, selected)
	_update_card("akhil", akhil_btn, akhil_status, selected)
	_update_card("firoz", firoz_btn, firoz_status, selected)

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
