extends Node

## MITTI RUN - Audio Manager
## Handles procedural Desi SFX and bgm rhythm using AudioStreamWAV synthesis

var sound_enabled: bool = true
var music_enabled: bool = true

var sfx_player: AudioStreamPlayer
var bgm_player: AudioStreamPlayer

var cached_sounds: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	sfx_player = AudioStreamPlayer.new()
	bgm_player = AudioStreamPlayer.new()
	add_child(sfx_player)
	add_child(bgm_player)
	
	_generate_procedural_sounds()

func set_sound(enabled: bool) -> void:
	sound_enabled = enabled

func set_music(enabled: bool) -> void:
	music_enabled = enabled
	if not music_enabled and bgm_player.playing:
		bgm_player.stop()

func play_coin() -> void:
	if not sound_enabled: return
	_play_synth("coin", 987.77, 1318.51, 0.12, "sine")

func play_jump() -> void:
	if not sound_enabled: return
	_play_synth("jump", 220.0, 480.0, 0.18, "triangle")

func play_slide() -> void:
	if not sound_enabled: return
	_play_synth("slide", 300.0, 150.0, 0.22, "noise")

func play_crash() -> void:
	if not sound_enabled: return
	_play_synth("crash", 180.0, 45.0, 0.35, "noise")

func play_powerup() -> void:
	if not sound_enabled: return
	_play_synth("powerup", 440.0, 880.0, 0.25, "square")

func play_click() -> void:
	if not sound_enabled: return
	_play_synth("click", 800.0, 950.0, 0.05, "sine")

func _generate_procedural_sounds() -> void:
	# Pre-synthesize core audio streams
	pass

func _play_synth(sound_name: String, f_start: float, f_end: float, duration: float, wave_type: String) -> void:
	var stream: AudioStreamWAV
	if cached_sounds.has(sound_name):
		stream = cached_sounds[sound_name]
	else:
		stream = _synthesize_wav(f_start, f_end, duration, wave_type)
		cached_sounds[sound_name] = stream
		
	var player = AudioStreamPlayer.new()
	add_child(player)
	player.stream = stream
	player.volume_db = -4.0
	player.play()
	player.finished.connect(func(): player.queue_free())

func _synthesize_wav(f_start: float, f_end: float, duration: float, wave_type: String) -> AudioStreamWAV:
	var sample_rate = 22050
	var total_samples = int(duration * sample_rate)
	var byte_array = PackedByteArray()
	byte_array.resize(total_samples * 2) # 16-bit mono
	
	var phase = 0.0
	for i in range(total_samples):
		var t = float(i) / float(total_samples)
		var current_freq = lerp(f_start, f_end, t)
		var delta_phase = (current_freq * 2.0 * PI) / sample_rate
		phase += delta_phase
		
		var sample_val = 0.0
		match wave_type:
			"sine":
				sample_val = sin(phase)
			"square":
				sample_val = 1.0 if sin(phase) >= 0.0 else -1.0
			"triangle":
				sample_val = asin(sin(phase)) * (2.0 / PI)
			"noise":
				sample_val = (randf() * 2.0 - 1.0) * (1.0 - t * 0.7)
		
		# Fade envelope to avoid clicks
		var envelope = 1.0
		if t < 0.05:
			envelope = t / 0.05
		else:
			envelope = (1.0 - t)
		
		sample_val *= envelope * 0.8
		var int16_val = int(clamp(sample_val, -1.0, 1.0) * 32767.0)
		
		# Little endian packing
		byte_array.encode_s16(i * 2, int16_val)
		
	var wav = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = byte_array
	return wav
