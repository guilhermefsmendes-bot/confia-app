import React from "react";
import ConfiaCreature, { type ConfiaCreatureState } from "./ConfiaCreature";
import { companionAvatars, type CompanionAvatarId } from "../../data/companionAvatars";

interface UniversalCompanionProps {
  avatarId: CompanionAvatarId;
  level: number;
  state?: ConfiaCreatureState;
  reacting?: boolean;
  equippedAccessoryIds?: string[];
}

/** Lightweight vector characters. Each character has three visual evolution stages. */
const UniversalCompanion: React.FC<UniversalCompanionProps> = ({
  avatarId, level, state = "neutral", reacting = false, equippedAccessoryIds = [],
}) => {
  if (avatarId === "confia") {
    return <ConfiaCreature level={level} state={state} reacting={reacting} equippedAccessoryIds={equippedAccessoryIds} />;
  }

  const stage = level >= 8 ? 3 : level >= 4 ? 2 : 1;
  const jump = reacting ? "translate(0 -5) scale(1.025)" : "translate(0 0) scale(1)";
  const uid = `avatar-${avatarId}`;

  return (
    <div className="flex items-center justify-center" aria-hidden="true" style={{ transform: jump, transformOrigin: "50% 80%", transition: "transform 220ms ease-out" }}>
      <svg viewBox="0 0 220 220" className="h-[245px] w-[245px] max-w-full overflow-visible select-none">
        <defs>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={avatarId === "dragon" ? "#B8F0D5" : avatarId === "samurai" ? "#F3B2A4" : avatarId === "astronaut" ? "#FFFFFF" : avatarId === "scientist" ? "#E8E5FF" : "#F5D18A"} />
            <stop offset=".55" stopColor={avatarId === "dragon" ? "#5EBD9A" : avatarId === "samurai" ? "#C85F54" : avatarId === "astronaut" ? "#B8D1F5" : avatarId === "scientist" ? "#B3A9E5" : "#D8A64D"} />
            <stop offset="1" stopColor={avatarId === "dragon" ? "#286B62" : avatarId === "samurai" ? "#712E36" : avatarId === "astronaut" ? "#526F9D" : avatarId === "scientist" ? "#6E65A1" : "#93632D"} />
          </linearGradient>
          <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
            <stop offset=".45" stopColor="#D9E1EA" />
            <stop offset="1" stopColor="#7C8EA4" />
          </linearGradient>
          <radialGradient id={`${uid}-visor`} cx="32%" cy="24%" r="80%">
            <stop offset="0" stopColor="#D8F7FF" />
            <stop offset=".48" stopColor="#7AB8D7" />
            <stop offset="1" stopColor="#263E63" />
          </radialGradient>
          <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity=".45" />
            <stop offset=".6" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="1" stopColor="#17243A" stopOpacity=".2" />
          </linearGradient>
        </defs>

        <ellipse cx="110" cy="195" rx="47" ry="8" fill="#24334A" opacity=".13" />

        {avatarId === "dragon" && <>
          <path d={stage >= 2 ? "M72 95 Q29 56 43 38 Q70 48 91 81 Z" : "M76 98 Q43 78 48 56 Q70 65 92 87 Z"} fill="#438E7A" stroke="#286B62" strokeWidth="2.5" />
          <path d={stage >= 2 ? "M148 95 Q191 56 177 38 Q150 48 129 81 Z" : "M144 98 Q177 78 172 56 Q150 65 128 87 Z"} fill="#438E7A" stroke="#286B62" strokeWidth="2.5" />
          <path d="M73 74 L62 47 Q80 50 91 68 L110 54 L129 68 Q140 50 158 47 L147 77" fill="url(#avatar-dragon-body)" stroke="#286B62" strokeWidth="3" strokeLinejoin="round" />
          <path d="M74 109 Q53 95 58 119 L68 142" fill="none" stroke="#5EBD9A" strokeWidth="13" strokeLinecap="round" />
          <path d="M148 108 Q169 94 164 118 L154 141" fill="none" stroke="#5EBD9A" strokeWidth="13" strokeLinecap="round" />
          <path d="M81 151 Q69 175 85 181 L135 181 Q151 175 139 151" fill="url(#avatar-dragon-body)" stroke="#286B62" strokeWidth="2.5" />
          <path d="M110 86 C79 82 68 101 70 129 C72 155 89 171 110 172 C131 171 148 155 150 129 C152 101 141 82 110 86 Z" fill="url(#avatar-dragon-body)" stroke="#286B62" strokeWidth="2.5" />
          <path d="M89 126 Q110 139 131 126 L127 156 Q110 166 93 156 Z" fill="#DDF6D8" opacity=".9" />
          {stage >= 3 && <path d="M70 145 Q45 154 57 170 Q68 179 78 162" fill="none" stroke="#438E7A" strokeWidth="10" strokeLinecap="round" />}
          <path d="M82 105 Q93 99 101 106 M119 106 Q127 99 138 105" fill="none" stroke="#24584F" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="91" cy="115" rx="5.5" ry="7" fill="#F8F4D8" /><ellipse cx="129" cy="115" rx="5.5" ry="7" fill="#F8F4D8" />
          <ellipse cx="92" cy="116" rx="2.3" ry="4.5" fill="#203B35" /><ellipse cx="128" cy="116" rx="2.3" ry="4.5" fill="#203B35" />
          <path d="M102 137 Q110 143 118 137" fill="none" stroke="#24584F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M81 92 L88 100 L95 91 M125 91 L132 100 L139 92" fill="none" stroke="#D8F1BD" strokeWidth="3" strokeLinecap="round" />
        </>}

        {avatarId === "samurai" && <>
          <path d="M65 103 Q49 121 61 153 L80 169 L140 169 L159 153 Q171 121 155 103 L142 117 L78 117 Z" fill="#303C54" stroke="#1E293B" strokeWidth="3" />
          <path d="M78 139 L110 157 L142 139 L135 177 L110 187 L85 177 Z" fill="url(#avatar-samurai-body)" stroke="#712E36" strokeWidth="2.5" />
          <path d="M73 91 Q72 62 110 61 Q148 62 147 91 L139 115 L81 115 Z" fill="url(#avatar-samurai-body)" stroke="#712E36" strokeWidth="3" />
          <path d="M65 86 Q110 54 155 86 L161 98 Q110 82 59 98 Z" fill="#273449" stroke="#D7B16B" strokeWidth="3" />
          <path d={stage >= 2 ? "M110 47 L96 69 L110 64 L124 69 Z" : "M110 53 L101 68 L110 65 L119 68 Z"} fill="#D7B16B" stroke="#9E713A" strokeWidth="2" />
          <path d="M76 110 Q110 126 144 110 L139 129 Q110 144 81 129 Z" fill="#F4D6C7" stroke="#712E36" strokeWidth="2" />
          <path d="M88 112 L88 127 M110 117 L110 137 M132 112 L132 127" stroke="#C85F54" strokeWidth="3" />
          <path d="M82 99 Q93 94 101 100 M119 100 Q127 94 138 99" fill="none" stroke="#402B2B" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="92" cy="105" rx="4" ry="3.5" fill="#332B31" /><ellipse cx="128" cy="105" rx="4" ry="3.5" fill="#332B31" />
          <path d="M102 119 Q110 123 118 119" fill="none" stroke="#75413E" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M72 151 L90 162 M148 151 L130 162" stroke="#E8C7A1" strokeWidth="3" strokeLinecap="round" />
          {stage >= 3 && <path d="M67 79 Q49 70 58 55 Q78 61 87 76 M153 79 Q171 70 162 55 Q142 61 133 76" fill="#303C54" stroke="#D7B16B" strokeWidth="2.5" />}
        </>}

        {avatarId === "astronaut" && <>
          <path d="M74 144 L67 171 Q66 183 82 184 L138 184 Q154 183 153 171 L146 144" fill="url(#avatar-astronaut-body)" stroke="#526F9D" strokeWidth="3" />
          <path d="M82 142 L68 154 L78 169 L91 158 M138 142 L152 154 L142 169 L129 158" fill="url(#avatar-astronaut-body)" stroke="#526F9D" strokeWidth="3" />
          <rect x="91" y="153" width="38" height="22" rx="6" fill="#E9F1FA" stroke="#7C97BA" strokeWidth="2" />
          <circle cx="110" cy="164" r="4" fill="#71BCE0" />
          <circle cx="110" cy="111" r={stage >= 3 ? 61 : 55} fill="url(#avatar-astronaut-metal)" stroke="#6D829F" strokeWidth="3.5" />
          <circle cx="110" cy="110" r={stage >= 3 ? 45 : 40} fill="url(#avatar-astronaut-visor)" stroke="#8DA4C0" strokeWidth="3" />
          <path d="M80 92 Q91 77 111 79" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity=".7" />
          <ellipse cx="96" cy="108" rx="4.5" ry="5.5" fill="#FFFFFF" /><ellipse cx="124" cy="108" rx="4.5" ry="5.5" fill="#FFFFFF" />
          <path d="M101 125 Q110 132 119 125" fill="none" stroke="#E5F8FF" strokeWidth="3" strokeLinecap="round" />
          <rect x="57" y="103" width="12" height="24" rx="5" fill="#AFC3D9" stroke="#6D829F" strokeWidth="2" />
          <rect x="151" y="103" width="12" height="24" rx="5" fill="#AFC3D9" stroke="#6D829F" strokeWidth="2" />
          {stage >= 2 && <><circle cx="78" cy="151" r="4" fill="#D9B86C" /><circle cx="142" cy="151" r="4" fill="#D9B86C" /></>}
          {stage >= 3 && <path d="M74 63 L82 48 L91 61 M146 63 L138 48 L129 61" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />}
        </>}

        {avatarId === "scientist" && <>
          <path d="M80 131 L73 153 L61 180 Q110 194 159 180 L147 153 L140 131 Z" fill="#F7F8FC" stroke="#7B77A9" strokeWidth="2.5" />
          <path d="M96 133 L110 153 L124 133 L130 181 L90 181 Z" fill="#A9D9D0" stroke="#7B77A9" strokeWidth="2" />
          <path d="M80 91 Q77 64 110 62 Q143 64 140 91 L137 129 Q110 148 83 129 Z" fill="url(#avatar-scientist-body)" stroke="#6E65A1" strokeWidth="2.8" />
          <path d={stage >= 2 ? "M76 92 Q62 62 86 49 Q103 37 121 47 Q151 39 146 78 L140 89 Q132 65 116 65 Q96 76 76 92 Z" : "M77 89 Q62 64 87 49 Q109 38 126 52 Q145 47 145 80 L137 89 Q125 66 111 68 Q93 76 77 89 Z"} fill="#5D4A42" stroke="#453A3B" strokeWidth="2.5" />
          <path d="M82 104 Q96 98 105 104 M115 104 Q124 98 138 104" fill="none" stroke="#493C43" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="94" cy="110" r="10" fill="none" stroke="#655E7D" strokeWidth="3" /><circle cx="126" cy="110" r="10" fill="none" stroke="#655E7D" strokeWidth="3" /><path d="M104 110 L116 110" stroke="#655E7D" strokeWidth="2.5" />
          <circle cx="94" cy="110" r="3" fill="#46394A" /><circle cx="126" cy="110" r="3" fill="#46394A" />
          <path d="M103 126 Q110 132 117 126" fill="none" stroke="#8D5E60" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M92 145 L110 166 L128 145" fill="none" stroke="#C3C8DA" strokeWidth="2" />
          {stage >= 3 && <><path d="M74 82 Q57 66 70 52" fill="none" stroke="#D6C7B8" strokeWidth="5" strokeLinecap="round" /><circle cx="148" cy="151" r="9" fill="#B9E7D9" stroke="#6E65A1" strokeWidth="2" /><path d="M148 143 V159 M140 151 H156" stroke="#6E65A1" strokeWidth="2" /></>}
        </>}

        {avatarId === "footballer" && <>
          <path d="M75 143 L67 177 Q65 187 82 187 L101 187 L104 163 L116 163 L119 187 L138 187 Q155 187 153 177 L145 143 Z" fill={stage >= 2 ? "#F4F7F1" : "#E5F2E9"} stroke="#36734F" strokeWidth="3" />
          <path d="M77 87 Q77 61 110 61 Q143 61 143 87 L139 129 Q110 145 81 129 Z" fill="url(#avatar-footballer-body)" stroke="#93632D" strokeWidth="2.8" />
          <path d="M77 89 Q110 103 143 89 L140 119 Q110 135 80 119 Z" fill="#F8F7EF" opacity=".95" />
          <path d="M84 141 L110 159 L136 141 L130 177 L90 177 Z" fill="#2E8654" stroke="#1E633B" strokeWidth="2" />
          <path d="M91 153 L110 166 L129 153" fill="none" stroke="#FFFFFF" strokeWidth="3" />
          <path d={stage >= 3 ? "M75 82 Q74 50 110 47 Q146 50 145 82 L135 72 L85 72 Z" : "M78 82 Q78 54 110 52 Q142 54 142 82 L133 75 L87 75 Z"} fill="#F7F4E9" stroke="#36734F" strokeWidth="2.8" />
          <path d="M86 103 Q97 98 104 104 M116 104 Q123 98 134 103" fill="none" stroke="#513A2C" strokeWidth="2.7" strokeLinecap="round" />
          <ellipse cx="94" cy="111" rx="4" ry="5" fill="#513A2C" /><ellipse cx="126" cy="111" rx="4" ry="5" fill="#513A2C" />
          <path d="M101 126 Q110 134 119 126" fill="none" stroke="#754D35" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M90 145 L95 152 M130 145 L125 152" stroke="#D5A84E" strokeWidth="4" strokeLinecap="round" />
          <circle cx="165" cy="174" r="18" fill="#F8F8F2" stroke="#6E7770" strokeWidth="2.5" />
          <path d="M165 164 L172 169 L169 178 L161 178 L158 169 Z M165 156 L165 163 M180 174 L173 174 M165 192 L165 185 M150 174 L157 174" fill="#303C42" stroke="#303C42" strokeWidth="2" strokeLinejoin="round" />
          {stage >= 2 && <path d="M79 156 L67 171 M141 156 L153 171" stroke="#E5F0E8" strokeWidth="5" strokeLinecap="round" />}
        </>}

        {avatarId !== "dragon" && avatarId !== "samurai" && avatarId !== "astronaut" && avatarId !== "scientist" && avatarId !== "footballer" && <>
          {/* Silhueta própria para os restantes 24 heróis, desenhada em SVG leve. */}
          <path d="M77 139 Q64 148 68 174 L88 185 L132 185 L152 174 Q156 148 143 139 L132 129 L88 129 Z" fill={`url(#${uid}-body)`} stroke={companionAvatars.find(a => a.id === avatarId)?.accent ?? "#7D9CAA"} strokeWidth="3" strokeLinejoin="round"/>
          <path d="M88 136 L110 154 L132 136 L127 179 L93 179 Z" fill="#FFF9F0" stroke="#B7A89B" strokeWidth="2"/>
          <path d="M76 92 Q76 61 110 61 Q144 61 144 92 L139 125 Q132 143 110 145 Q88 143 81 125 Z" fill={`url(#${uid}-body)`} stroke={companionAvatars.find(a => a.id === avatarId)?.accent ?? "#7D9CAA"} strokeWidth="3"/>
          <path d="M83 103 Q95 97 103 103 M117 103 Q125 97 137 103" fill="none" stroke="#34333B" strokeWidth="3" strokeLinecap="round"/>
          <ellipse cx="94" cy="111" rx="4.5" ry="5.5" fill="#30313A"/><ellipse cx="126" cy="111" rx="4.5" ry="5.5" fill="#30313A"/>
          <path d="M101 127 Q110 135 119 127" fill="none" stroke="#744F4A" strokeWidth="2.7" strokeLinecap="round"/>
          {avatarId === "knight" && <><path d="M66 91 L69 65 L91 73 L110 57 L129 73 L151 65 L154 91 L142 102 L78 102 Z" fill="#AAB7C5" stroke="#5D6B7D" strokeWidth="3"/><path d="M82 86 H138 M110 66 V100" stroke="#E9D39A" strokeWidth="4"/></>}
          {avatarId === "wizard" && <><path d="M66 83 L94 75 L110 34 L126 75 L154 83 Z" fill="#55437E" stroke="#30294D" strokeWidth="3"/><path d="M70 83 Q110 71 150 83 L148 92 Q110 103 72 92 Z" fill="#D9B968" stroke="#55437E" strokeWidth="2"/><path d="M110 51 L114 59 L122 61 L114 64 L110 72 L106 64 L98 61 L106 59 Z" fill="#F8E7A1"/></>}
          {avatarId === "ninja" && <><path d="M72 85 Q110 47 148 85 L145 111 Q110 125 75 111 Z" fill="#303344" stroke="#171C2A" strokeWidth="3"/><path d="M76 97 Q110 88 144 97" stroke="#D65B57" strokeWidth="8"/><path d="M89 78 L94 82 M126 82 L131 78" stroke="#F4F0E9" strokeWidth="3"/></>}
          {avatarId === "explorer" && <><path d="M69 86 Q110 60 151 86 L146 96 L74 96 Z" fill="#C99B5D" stroke="#745638" strokeWidth="3"/><path d="M86 79 Q84 58 110 57 Q136 58 134 79 Z" fill="#B98443" stroke="#745638" strokeWidth="3"/><path d="M83 89 H137" stroke="#F3D39A" strokeWidth="5"/></>}
          {avatarId === "robot" && <><rect x="73" y="68" width="74" height="65" rx="15" fill="#B9CED5" stroke="#526F7C" strokeWidth="3"/><path d="M110 68 V51" stroke="#526F7C" strokeWidth="4"/><circle cx="110" cy="46" r="7" fill="#F0C968"/><rect x="84" y="91" width="16" height="12" rx="4" fill="#4D9DB4"/><rect x="120" y="91" width="16" height="12" rx="4" fill="#4D9DB4"/><path d="M94 116 H126" stroke="#526F7C" strokeWidth="4" strokeLinecap="round"/></>}
          {avatarId === "phoenix" && <><path d="M82 92 Q49 73 48 48 Q76 55 94 79 L110 64 L126 79 Q144 55 172 48 Q171 73 138 92" fill="#E87545" stroke="#A93F38" strokeWidth="3"/><path d="M87 78 L98 88 L110 70 L122 88 L133 78" fill="#F6C65F"/></>}
          {avatarId === "mermaid" && <><path d="M86 139 Q110 157 134 139 L143 166 L123 181 L110 167 L97 181 L77 166 Z" fill="#4BB7B2" stroke="#267F88" strokeWidth="3"/><path d="M82 83 Q110 48 138 83 L132 97 L88 97 Z" fill="#43A7A8" stroke="#267F88" strokeWidth="3"/><path d="M88 77 L76 59 L96 67 L110 48 L124 67 L144 59 L132 79" fill="#D8C7F2" stroke="#4B8794" strokeWidth="2.5"/></>}
          {avatarId === "pirate" && <><path d="M65 84 Q110 55 155 84 L149 94 L71 94 Z" fill="#30313A" stroke="#15171D" strokeWidth="3"/><path d="M81 83 Q83 55 110 55 Q137 55 139 83 Z" fill="#30313A" stroke="#15171D" strokeWidth="3"/><path d="M96 72 L110 64 L124 72 L110 80 Z" fill="#F1E8D7"/><path d="M82 100 H138" stroke="#D7A64D" strokeWidth="5"/></>}
          {avatarId === "archer" && <><path d="M71 99 Q67 56 110 54 Q153 56 149 99 L137 89 L83 89 Z" fill="#597B50" stroke="#36533C" strokeWidth="3"/><path d="M147 103 Q171 127 145 152" fill="none" stroke="#C89B61" strokeWidth="3"/><path d="M147 103 L147 152" stroke="#C89B61" strokeWidth="2"/></>}
          {avatarId === "forestGuardian" && <><path d="M74 88 L62 65 L88 73 L99 48 L112 70 L134 47 L136 76 L158 65 L145 94" fill="#5C9B69" stroke="#356E4D" strokeWidth="3"/><path d="M80 147 L65 165 M140 147 L155 165" stroke="#6AA875" strokeWidth="7" strokeLinecap="round"/></>}
          {avatarId === "artist" && <><path d="M72 79 Q80 50 111 56 Q140 57 147 79 L137 86 L81 86 Z" fill="#D786A5" stroke="#8F4F73" strokeWidth="3"/><circle cx="97" cy="70" r="4" fill="#F2C85B"/><circle cx="111" cy="66" r="4" fill="#5C9BB5"/><circle cx="124" cy="72" r="4" fill="#7AA66A"/></>}
          {avatarId === "musician" && <><path d="M76 93 V80 Q76 54 110 54 Q144 54 144 80 V93" fill="none" stroke="#554779" strokeWidth="9"/><rect x="69" y="84" width="15" height="25" rx="6" fill="#8C7AC5"/><rect x="136" y="84" width="15" height="25" rx="6" fill="#8C7AC5"/><path d="M110 139 L110 161 Q126 164 124 151 Q122 142 110 149" fill="#8C7AC5"/></>}
          {avatarId === "physicist" && <><circle cx="110" cy="84" r="30" fill="none" stroke="#4E9AB7" strokeWidth="3"/><ellipse cx="110" cy="84" rx="43" ry="15" fill="none" stroke="#4E9AB7" strokeWidth="3" transform="rotate(-35 110 84)"/><circle cx="145" cy="61" r="5" fill="#E5C45F"/></>}
          {avatarId === "inventor" && <><circle cx="89" cy="82" r="13" fill="none" stroke="#D0A34E" strokeWidth="5"/><circle cx="131" cy="82" r="13" fill="none" stroke="#D0A34E" strokeWidth="5"/><path d="M102 82 H118" stroke="#D0A34E" strokeWidth="4"/><path d="M76 61 L68 51 M144 61 L152 51" stroke="#6B717A" strokeWidth="3"/></>}
          {avatarId === "mountaineer" && <><path d="M70 83 Q74 53 110 53 Q146 53 150 83 L141 88 L79 88 Z" fill="#7195A9" stroke="#3E637A" strokeWidth="3"/><path d="M72 83 H148" stroke="#E8F2F5" strokeWidth="5"/><circle cx="110" cy="65" r="5" fill="#E4C66C"/></>}
          {avatarId === "diver" && <><circle cx="110" cy="101" r="47" fill="#A6DDE8" fillOpacity=".32" stroke="#428BB6" strokeWidth="7"/><path d="M73 110 Q110 126 147 110" fill="none" stroke="#428BB6" strokeWidth="4"/><circle cx="92" cy="102" r="5" fill="#428BB6"/><circle cx="128" cy="102" r="5" fill="#428BB6"/><path d="M110 52 V43 M104 43 H116" stroke="#428BB6" strokeWidth="3"/></>}
          {avatarId === "pilot" && <><path d="M73 83 Q75 57 110 57 Q145 57 147 83 L139 91 L81 91 Z" fill="#6C8EAF" stroke="#3E5F80" strokeWidth="3"/><path d="M73 84 H147" stroke="#F4E7B5" strokeWidth="5"/><path d="M110 61 V80" stroke="#F4E7B5" strokeWidth="3"/></>}
          {avatarId === "detective" && <><path d="M69 83 L79 62 L103 69 L117 69 L141 62 L151 83 L139 88 L81 88 Z" fill="#8B7868" stroke="#55483F" strokeWidth="3"/><path d="M82 78 Q110 67 138 78" fill="none" stroke="#C7B7A7" strokeWidth="4"/></>}
          {avatarId === "alchemist" && <><path d="M97 55 H123 M102 55 V76 L83 108 Q78 121 94 126 H126 Q142 121 137 108 L118 76 V55" fill="#C4A04C" fillOpacity=".8" stroke="#866A32" strokeWidth="3"/><path d="M89 108 Q110 100 131 108" stroke="#FFF1AE" strokeWidth="5"/></>}
          {avatarId === "lightGuardian" && <><ellipse cx="110" cy="59" rx="30" ry="8" fill="none" stroke="#E2BE69" strokeWidth="5"/><path d="M110 39 L116 51 L129 53 L119 62 L121 75 L110 68 L99 75 L101 62 L91 53 L104 51 Z" fill="#F2D98B"/></>}
          {avatarId === "snowAdventurer" && <><path d="M72 84 Q76 55 110 55 Q144 55 148 84 L139 91 L81 91 Z" fill="#91BFD8" stroke="#4B88A9" strokeWidth="3"/><circle cx="75" cy="90" r="10" fill="#D9F0F7" stroke="#4B88A9" strokeWidth="3"/><circle cx="145" cy="90" r="10" fill="#D9F0F7" stroke="#4B88A9" strokeWidth="3"/></>}
          {avatarId === "racer" && <><path d="M70 86 Q70 54 110 54 Q150 54 150 86 L141 91 L79 91 Z" fill="#D65D58" stroke="#8D3038" strokeWidth="3"/><path d="M80 77 H140" stroke="#EAF2F6" strokeWidth="7"/><path d="M90 63 L110 58 L130 63" fill="none" stroke="#EAF2F6" strokeWidth="3"/></>}
          {avatarId === "martialArtist" && <><path d="M75 84 Q110 58 145 84" fill="none" stroke="#C59A65" strokeWidth="10"/><path d="M75 84 Q110 98 145 84" fill="none" stroke="#F3E9D6" strokeWidth="5"/><path d="M110 91 V103" stroke="#F3E9D6" strokeWidth="3"/></>}
          {avatarId === "timeTraveler" && <><circle cx="110" cy="84" r="35" fill="#DCE4FF" fillOpacity=".4" stroke="#7C8ED4" strokeWidth="4"/><path d="M110 60 V85 L128 96" fill="none" stroke="#5969B1" strokeWidth="4" strokeLinecap="round"/><path d="M97 47 L110 39 L123 47" fill="none" stroke="#7C8ED4" strokeWidth="4"/></>}
          {stage >= 2 && <path d="M66 143 Q51 129 48 147 Q52 167 74 166 M154 143 Q169 129 172 147 Q168 167 146 166" fill="none" stroke={companionAvatars.find(a => a.id === avatarId)?.accent ?? "#7D9CAA"} strokeWidth={stage >= 3 ? 11 : 7} strokeLinecap="round"/>}
          {stage >= 3 && <path d="M61 47 L66 58 L78 61 L66 65 L61 77 L56 65 L44 61 L56 58 Z" fill={companionAvatars.find(a => a.id === avatarId)?.accent ?? "#E2BE69"}/>}
        </>}

        {/* Shared soft material pass, with no filters, bitmap textures or animated loops. */}
        <path d={avatarId === "astronaut" ? "M110 56 A55 55 0 0 0 110 166" : "M110 60 C80 60 66 81 67 112 C66 144 83 166 110 174 C137 166 154 144 153 112 C154 81 140 60 110 60 Z"} fill={`url(#${uid}-shade)`} opacity=".22" />
        {stage >= 3 && <path d="M47 58 L50 64 L57 67 L50 70 L47 77 L44 70 L37 67 L44 64 Z" fill="#F0D58A" opacity=".95" />}
      </svg>
    </div>
  );
};

export default React.memo(UniversalCompanion);
