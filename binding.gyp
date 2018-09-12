{
	"targets": [{
		"target_name": "mecab",
		"sources": [
			"src/mecab.cc"
		],
		"include_dirs" : [
			"<!(node -e \"require('nan')\")"
		],
		"conditions": [
			['OS=="mac"', {
				"link_settings": {
				    "libraries": [
						"-L<(module_root_dir)/mecab/", "-lmecab"
					]
				},
                "include_dirs": [
					"<(module_root_dir)/mecab/",
                    "/usr/local/include/"
                ],
	        }],
			["OS=='linux'", {
				"link_settings": {
				    "libraries": [
						"-L<(module_root_dir)/mecab/", "-lmecab"
					]
				},
                "include_dirs": [
					"<(module_root_dir)/mecab/",
                    "/usr/local/include/"
                ],
			}],
			['OS=="win"', {
                "include_dirs": [
					"<(module_root_dir)/mecab/",
                    "/usr/local/include/"
                ],
				'msvs_settings': {
					'VCLinkerTool': {
						'AdditionalDependencies': [
							'<(module_root_dir)\mecab\libmecab.lib'
						]
					}
				},
				'defines': [
		            'DLL_EXPORT'
				]
			}]
		],
	}]
}