import {sts, Result, Option, Bytes} from '../../pallet.support'

export type LookupSource = LookupSource_AccountId | LookupSource_Idx0 | LookupSource_Idx1 | LookupSource_Idx10 | LookupSource_Idx100 | LookupSource_Idx101 | LookupSource_Idx102 | LookupSource_Idx103 | LookupSource_Idx104 | LookupSource_Idx105 | LookupSource_Idx106 | LookupSource_Idx107 | LookupSource_Idx108 | LookupSource_Idx109 | LookupSource_Idx11 | LookupSource_Idx110 | LookupSource_Idx111 | LookupSource_Idx112 | LookupSource_Idx113 | LookupSource_Idx114 | LookupSource_Idx115 | LookupSource_Idx116 | LookupSource_Idx117 | LookupSource_Idx118 | LookupSource_Idx119 | LookupSource_Idx12 | LookupSource_Idx120 | LookupSource_Idx121 | LookupSource_Idx122 | LookupSource_Idx123 | LookupSource_Idx124 | LookupSource_Idx125 | LookupSource_Idx126 | LookupSource_Idx127 | LookupSource_Idx128 | LookupSource_Idx129 | LookupSource_Idx13 | LookupSource_Idx130 | LookupSource_Idx131 | LookupSource_Idx132 | LookupSource_Idx133 | LookupSource_Idx134 | LookupSource_Idx135 | LookupSource_Idx136 | LookupSource_Idx137 | LookupSource_Idx138 | LookupSource_Idx139 | LookupSource_Idx14 | LookupSource_Idx140 | LookupSource_Idx141 | LookupSource_Idx142 | LookupSource_Idx143 | LookupSource_Idx144 | LookupSource_Idx145 | LookupSource_Idx146 | LookupSource_Idx147 | LookupSource_Idx148 | LookupSource_Idx149 | LookupSource_Idx15 | LookupSource_Idx150 | LookupSource_Idx151 | LookupSource_Idx152 | LookupSource_Idx153 | LookupSource_Idx154 | LookupSource_Idx155 | LookupSource_Idx156 | LookupSource_Idx157 | LookupSource_Idx158 | LookupSource_Idx159 | LookupSource_Idx16 | LookupSource_Idx160 | LookupSource_Idx161 | LookupSource_Idx162 | LookupSource_Idx163 | LookupSource_Idx164 | LookupSource_Idx165 | LookupSource_Idx166 | LookupSource_Idx167 | LookupSource_Idx168 | LookupSource_Idx169 | LookupSource_Idx17 | LookupSource_Idx170 | LookupSource_Idx171 | LookupSource_Idx172 | LookupSource_Idx173 | LookupSource_Idx174 | LookupSource_Idx175 | LookupSource_Idx176 | LookupSource_Idx177 | LookupSource_Idx178 | LookupSource_Idx179 | LookupSource_Idx18 | LookupSource_Idx180 | LookupSource_Idx181 | LookupSource_Idx182 | LookupSource_Idx183 | LookupSource_Idx184 | LookupSource_Idx185 | LookupSource_Idx186 | LookupSource_Idx187 | LookupSource_Idx188 | LookupSource_Idx189 | LookupSource_Idx19 | LookupSource_Idx190 | LookupSource_Idx191 | LookupSource_Idx192 | LookupSource_Idx193 | LookupSource_Idx194 | LookupSource_Idx195 | LookupSource_Idx196 | LookupSource_Idx197 | LookupSource_Idx198 | LookupSource_Idx199 | LookupSource_Idx2 | LookupSource_Idx20 | LookupSource_Idx200 | LookupSource_Idx201 | LookupSource_Idx202 | LookupSource_Idx203 | LookupSource_Idx204 | LookupSource_Idx205 | LookupSource_Idx206 | LookupSource_Idx207 | LookupSource_Idx208 | LookupSource_Idx209 | LookupSource_Idx21 | LookupSource_Idx210 | LookupSource_Idx211 | LookupSource_Idx212 | LookupSource_Idx213 | LookupSource_Idx214 | LookupSource_Idx215 | LookupSource_Idx216 | LookupSource_Idx217 | LookupSource_Idx218 | LookupSource_Idx219 | LookupSource_Idx22 | LookupSource_Idx220 | LookupSource_Idx221 | LookupSource_Idx222 | LookupSource_Idx223 | LookupSource_Idx224 | LookupSource_Idx225 | LookupSource_Idx226 | LookupSource_Idx227 | LookupSource_Idx228 | LookupSource_Idx229 | LookupSource_Idx23 | LookupSource_Idx230 | LookupSource_Idx231 | LookupSource_Idx232 | LookupSource_Idx233 | LookupSource_Idx234 | LookupSource_Idx235 | LookupSource_Idx236 | LookupSource_Idx237 | LookupSource_Idx238 | LookupSource_Idx24 | LookupSource_Idx25 | LookupSource_Idx26 | LookupSource_Idx27 | LookupSource_Idx28 | LookupSource_Idx29 | LookupSource_Idx3 | LookupSource_Idx30 | LookupSource_Idx31 | LookupSource_Idx32 | LookupSource_Idx33 | LookupSource_Idx34 | LookupSource_Idx35 | LookupSource_Idx36 | LookupSource_Idx37 | LookupSource_Idx38 | LookupSource_Idx39 | LookupSource_Idx4 | LookupSource_Idx40 | LookupSource_Idx41 | LookupSource_Idx42 | LookupSource_Idx43 | LookupSource_Idx44 | LookupSource_Idx45 | LookupSource_Idx46 | LookupSource_Idx47 | LookupSource_Idx48 | LookupSource_Idx49 | LookupSource_Idx5 | LookupSource_Idx50 | LookupSource_Idx51 | LookupSource_Idx52 | LookupSource_Idx53 | LookupSource_Idx54 | LookupSource_Idx55 | LookupSource_Idx56 | LookupSource_Idx57 | LookupSource_Idx58 | LookupSource_Idx59 | LookupSource_Idx6 | LookupSource_Idx60 | LookupSource_Idx61 | LookupSource_Idx62 | LookupSource_Idx63 | LookupSource_Idx64 | LookupSource_Idx65 | LookupSource_Idx66 | LookupSource_Idx67 | LookupSource_Idx68 | LookupSource_Idx69 | LookupSource_Idx7 | LookupSource_Idx70 | LookupSource_Idx71 | LookupSource_Idx72 | LookupSource_Idx73 | LookupSource_Idx74 | LookupSource_Idx75 | LookupSource_Idx76 | LookupSource_Idx77 | LookupSource_Idx78 | LookupSource_Idx79 | LookupSource_Idx8 | LookupSource_Idx80 | LookupSource_Idx81 | LookupSource_Idx82 | LookupSource_Idx83 | LookupSource_Idx84 | LookupSource_Idx85 | LookupSource_Idx86 | LookupSource_Idx87 | LookupSource_Idx88 | LookupSource_Idx89 | LookupSource_Idx9 | LookupSource_Idx90 | LookupSource_Idx91 | LookupSource_Idx92 | LookupSource_Idx93 | LookupSource_Idx94 | LookupSource_Idx95 | LookupSource_Idx96 | LookupSource_Idx97 | LookupSource_Idx98 | LookupSource_Idx99 | LookupSource_IdxU16 | LookupSource_IdxU32 | LookupSource_IdxU64

export type LookupSource_AccountId = {
    __kind: 'AccountId'
    value: AccountId
}

export type LookupSource_Idx0 = {
    __kind: 'Idx0'
}

export type LookupSource_Idx1 = {
    __kind: 'Idx1'
}

export type LookupSource_Idx10 = {
    __kind: 'Idx10'
}

export type LookupSource_Idx100 = {
    __kind: 'Idx100'
}

export type LookupSource_Idx101 = {
    __kind: 'Idx101'
}

export type LookupSource_Idx102 = {
    __kind: 'Idx102'
}

export type LookupSource_Idx103 = {
    __kind: 'Idx103'
}

export type LookupSource_Idx104 = {
    __kind: 'Idx104'
}

export type LookupSource_Idx105 = {
    __kind: 'Idx105'
}

export type LookupSource_Idx106 = {
    __kind: 'Idx106'
}

export type LookupSource_Idx107 = {
    __kind: 'Idx107'
}

export type LookupSource_Idx108 = {
    __kind: 'Idx108'
}

export type LookupSource_Idx109 = {
    __kind: 'Idx109'
}

export type LookupSource_Idx11 = {
    __kind: 'Idx11'
}

export type LookupSource_Idx110 = {
    __kind: 'Idx110'
}

export type LookupSource_Idx111 = {
    __kind: 'Idx111'
}

export type LookupSource_Idx112 = {
    __kind: 'Idx112'
}

export type LookupSource_Idx113 = {
    __kind: 'Idx113'
}

export type LookupSource_Idx114 = {
    __kind: 'Idx114'
}

export type LookupSource_Idx115 = {
    __kind: 'Idx115'
}

export type LookupSource_Idx116 = {
    __kind: 'Idx116'
}

export type LookupSource_Idx117 = {
    __kind: 'Idx117'
}

export type LookupSource_Idx118 = {
    __kind: 'Idx118'
}

export type LookupSource_Idx119 = {
    __kind: 'Idx119'
}

export type LookupSource_Idx12 = {
    __kind: 'Idx12'
}

export type LookupSource_Idx120 = {
    __kind: 'Idx120'
}

export type LookupSource_Idx121 = {
    __kind: 'Idx121'
}

export type LookupSource_Idx122 = {
    __kind: 'Idx122'
}

export type LookupSource_Idx123 = {
    __kind: 'Idx123'
}

export type LookupSource_Idx124 = {
    __kind: 'Idx124'
}

export type LookupSource_Idx125 = {
    __kind: 'Idx125'
}

export type LookupSource_Idx126 = {
    __kind: 'Idx126'
}

export type LookupSource_Idx127 = {
    __kind: 'Idx127'
}

export type LookupSource_Idx128 = {
    __kind: 'Idx128'
}

export type LookupSource_Idx129 = {
    __kind: 'Idx129'
}

export type LookupSource_Idx13 = {
    __kind: 'Idx13'
}

export type LookupSource_Idx130 = {
    __kind: 'Idx130'
}

export type LookupSource_Idx131 = {
    __kind: 'Idx131'
}

export type LookupSource_Idx132 = {
    __kind: 'Idx132'
}

export type LookupSource_Idx133 = {
    __kind: 'Idx133'
}

export type LookupSource_Idx134 = {
    __kind: 'Idx134'
}

export type LookupSource_Idx135 = {
    __kind: 'Idx135'
}

export type LookupSource_Idx136 = {
    __kind: 'Idx136'
}

export type LookupSource_Idx137 = {
    __kind: 'Idx137'
}

export type LookupSource_Idx138 = {
    __kind: 'Idx138'
}

export type LookupSource_Idx139 = {
    __kind: 'Idx139'
}

export type LookupSource_Idx14 = {
    __kind: 'Idx14'
}

export type LookupSource_Idx140 = {
    __kind: 'Idx140'
}

export type LookupSource_Idx141 = {
    __kind: 'Idx141'
}

export type LookupSource_Idx142 = {
    __kind: 'Idx142'
}

export type LookupSource_Idx143 = {
    __kind: 'Idx143'
}

export type LookupSource_Idx144 = {
    __kind: 'Idx144'
}

export type LookupSource_Idx145 = {
    __kind: 'Idx145'
}

export type LookupSource_Idx146 = {
    __kind: 'Idx146'
}

export type LookupSource_Idx147 = {
    __kind: 'Idx147'
}

export type LookupSource_Idx148 = {
    __kind: 'Idx148'
}

export type LookupSource_Idx149 = {
    __kind: 'Idx149'
}

export type LookupSource_Idx15 = {
    __kind: 'Idx15'
}

export type LookupSource_Idx150 = {
    __kind: 'Idx150'
}

export type LookupSource_Idx151 = {
    __kind: 'Idx151'
}

export type LookupSource_Idx152 = {
    __kind: 'Idx152'
}

export type LookupSource_Idx153 = {
    __kind: 'Idx153'
}

export type LookupSource_Idx154 = {
    __kind: 'Idx154'
}

export type LookupSource_Idx155 = {
    __kind: 'Idx155'
}

export type LookupSource_Idx156 = {
    __kind: 'Idx156'
}

export type LookupSource_Idx157 = {
    __kind: 'Idx157'
}

export type LookupSource_Idx158 = {
    __kind: 'Idx158'
}

export type LookupSource_Idx159 = {
    __kind: 'Idx159'
}

export type LookupSource_Idx16 = {
    __kind: 'Idx16'
}

export type LookupSource_Idx160 = {
    __kind: 'Idx160'
}

export type LookupSource_Idx161 = {
    __kind: 'Idx161'
}

export type LookupSource_Idx162 = {
    __kind: 'Idx162'
}

export type LookupSource_Idx163 = {
    __kind: 'Idx163'
}

export type LookupSource_Idx164 = {
    __kind: 'Idx164'
}

export type LookupSource_Idx165 = {
    __kind: 'Idx165'
}

export type LookupSource_Idx166 = {
    __kind: 'Idx166'
}

export type LookupSource_Idx167 = {
    __kind: 'Idx167'
}

export type LookupSource_Idx168 = {
    __kind: 'Idx168'
}

export type LookupSource_Idx169 = {
    __kind: 'Idx169'
}

export type LookupSource_Idx17 = {
    __kind: 'Idx17'
}

export type LookupSource_Idx170 = {
    __kind: 'Idx170'
}

export type LookupSource_Idx171 = {
    __kind: 'Idx171'
}

export type LookupSource_Idx172 = {
    __kind: 'Idx172'
}

export type LookupSource_Idx173 = {
    __kind: 'Idx173'
}

export type LookupSource_Idx174 = {
    __kind: 'Idx174'
}

export type LookupSource_Idx175 = {
    __kind: 'Idx175'
}

export type LookupSource_Idx176 = {
    __kind: 'Idx176'
}

export type LookupSource_Idx177 = {
    __kind: 'Idx177'
}

export type LookupSource_Idx178 = {
    __kind: 'Idx178'
}

export type LookupSource_Idx179 = {
    __kind: 'Idx179'
}

export type LookupSource_Idx18 = {
    __kind: 'Idx18'
}

export type LookupSource_Idx180 = {
    __kind: 'Idx180'
}

export type LookupSource_Idx181 = {
    __kind: 'Idx181'
}

export type LookupSource_Idx182 = {
    __kind: 'Idx182'
}

export type LookupSource_Idx183 = {
    __kind: 'Idx183'
}

export type LookupSource_Idx184 = {
    __kind: 'Idx184'
}

export type LookupSource_Idx185 = {
    __kind: 'Idx185'
}

export type LookupSource_Idx186 = {
    __kind: 'Idx186'
}

export type LookupSource_Idx187 = {
    __kind: 'Idx187'
}

export type LookupSource_Idx188 = {
    __kind: 'Idx188'
}

export type LookupSource_Idx189 = {
    __kind: 'Idx189'
}

export type LookupSource_Idx19 = {
    __kind: 'Idx19'
}

export type LookupSource_Idx190 = {
    __kind: 'Idx190'
}

export type LookupSource_Idx191 = {
    __kind: 'Idx191'
}

export type LookupSource_Idx192 = {
    __kind: 'Idx192'
}

export type LookupSource_Idx193 = {
    __kind: 'Idx193'
}

export type LookupSource_Idx194 = {
    __kind: 'Idx194'
}

export type LookupSource_Idx195 = {
    __kind: 'Idx195'
}

export type LookupSource_Idx196 = {
    __kind: 'Idx196'
}

export type LookupSource_Idx197 = {
    __kind: 'Idx197'
}

export type LookupSource_Idx198 = {
    __kind: 'Idx198'
}

export type LookupSource_Idx199 = {
    __kind: 'Idx199'
}

export type LookupSource_Idx2 = {
    __kind: 'Idx2'
}

export type LookupSource_Idx20 = {
    __kind: 'Idx20'
}

export type LookupSource_Idx200 = {
    __kind: 'Idx200'
}

export type LookupSource_Idx201 = {
    __kind: 'Idx201'
}

export type LookupSource_Idx202 = {
    __kind: 'Idx202'
}

export type LookupSource_Idx203 = {
    __kind: 'Idx203'
}

export type LookupSource_Idx204 = {
    __kind: 'Idx204'
}

export type LookupSource_Idx205 = {
    __kind: 'Idx205'
}

export type LookupSource_Idx206 = {
    __kind: 'Idx206'
}

export type LookupSource_Idx207 = {
    __kind: 'Idx207'
}

export type LookupSource_Idx208 = {
    __kind: 'Idx208'
}

export type LookupSource_Idx209 = {
    __kind: 'Idx209'
}

export type LookupSource_Idx21 = {
    __kind: 'Idx21'
}

export type LookupSource_Idx210 = {
    __kind: 'Idx210'
}

export type LookupSource_Idx211 = {
    __kind: 'Idx211'
}

export type LookupSource_Idx212 = {
    __kind: 'Idx212'
}

export type LookupSource_Idx213 = {
    __kind: 'Idx213'
}

export type LookupSource_Idx214 = {
    __kind: 'Idx214'
}

export type LookupSource_Idx215 = {
    __kind: 'Idx215'
}

export type LookupSource_Idx216 = {
    __kind: 'Idx216'
}

export type LookupSource_Idx217 = {
    __kind: 'Idx217'
}

export type LookupSource_Idx218 = {
    __kind: 'Idx218'
}

export type LookupSource_Idx219 = {
    __kind: 'Idx219'
}

export type LookupSource_Idx22 = {
    __kind: 'Idx22'
}

export type LookupSource_Idx220 = {
    __kind: 'Idx220'
}

export type LookupSource_Idx221 = {
    __kind: 'Idx221'
}

export type LookupSource_Idx222 = {
    __kind: 'Idx222'
}

export type LookupSource_Idx223 = {
    __kind: 'Idx223'
}

export type LookupSource_Idx224 = {
    __kind: 'Idx224'
}

export type LookupSource_Idx225 = {
    __kind: 'Idx225'
}

export type LookupSource_Idx226 = {
    __kind: 'Idx226'
}

export type LookupSource_Idx227 = {
    __kind: 'Idx227'
}

export type LookupSource_Idx228 = {
    __kind: 'Idx228'
}

export type LookupSource_Idx229 = {
    __kind: 'Idx229'
}

export type LookupSource_Idx23 = {
    __kind: 'Idx23'
}

export type LookupSource_Idx230 = {
    __kind: 'Idx230'
}

export type LookupSource_Idx231 = {
    __kind: 'Idx231'
}

export type LookupSource_Idx232 = {
    __kind: 'Idx232'
}

export type LookupSource_Idx233 = {
    __kind: 'Idx233'
}

export type LookupSource_Idx234 = {
    __kind: 'Idx234'
}

export type LookupSource_Idx235 = {
    __kind: 'Idx235'
}

export type LookupSource_Idx236 = {
    __kind: 'Idx236'
}

export type LookupSource_Idx237 = {
    __kind: 'Idx237'
}

export type LookupSource_Idx238 = {
    __kind: 'Idx238'
}

export type LookupSource_Idx24 = {
    __kind: 'Idx24'
}

export type LookupSource_Idx25 = {
    __kind: 'Idx25'
}

export type LookupSource_Idx26 = {
    __kind: 'Idx26'
}

export type LookupSource_Idx27 = {
    __kind: 'Idx27'
}

export type LookupSource_Idx28 = {
    __kind: 'Idx28'
}

export type LookupSource_Idx29 = {
    __kind: 'Idx29'
}

export type LookupSource_Idx3 = {
    __kind: 'Idx3'
}

export type LookupSource_Idx30 = {
    __kind: 'Idx30'
}

export type LookupSource_Idx31 = {
    __kind: 'Idx31'
}

export type LookupSource_Idx32 = {
    __kind: 'Idx32'
}

export type LookupSource_Idx33 = {
    __kind: 'Idx33'
}

export type LookupSource_Idx34 = {
    __kind: 'Idx34'
}

export type LookupSource_Idx35 = {
    __kind: 'Idx35'
}

export type LookupSource_Idx36 = {
    __kind: 'Idx36'
}

export type LookupSource_Idx37 = {
    __kind: 'Idx37'
}

export type LookupSource_Idx38 = {
    __kind: 'Idx38'
}

export type LookupSource_Idx39 = {
    __kind: 'Idx39'
}

export type LookupSource_Idx4 = {
    __kind: 'Idx4'
}

export type LookupSource_Idx40 = {
    __kind: 'Idx40'
}

export type LookupSource_Idx41 = {
    __kind: 'Idx41'
}

export type LookupSource_Idx42 = {
    __kind: 'Idx42'
}

export type LookupSource_Idx43 = {
    __kind: 'Idx43'
}

export type LookupSource_Idx44 = {
    __kind: 'Idx44'
}

export type LookupSource_Idx45 = {
    __kind: 'Idx45'
}

export type LookupSource_Idx46 = {
    __kind: 'Idx46'
}

export type LookupSource_Idx47 = {
    __kind: 'Idx47'
}

export type LookupSource_Idx48 = {
    __kind: 'Idx48'
}

export type LookupSource_Idx49 = {
    __kind: 'Idx49'
}

export type LookupSource_Idx5 = {
    __kind: 'Idx5'
}

export type LookupSource_Idx50 = {
    __kind: 'Idx50'
}

export type LookupSource_Idx51 = {
    __kind: 'Idx51'
}

export type LookupSource_Idx52 = {
    __kind: 'Idx52'
}

export type LookupSource_Idx53 = {
    __kind: 'Idx53'
}

export type LookupSource_Idx54 = {
    __kind: 'Idx54'
}

export type LookupSource_Idx55 = {
    __kind: 'Idx55'
}

export type LookupSource_Idx56 = {
    __kind: 'Idx56'
}

export type LookupSource_Idx57 = {
    __kind: 'Idx57'
}

export type LookupSource_Idx58 = {
    __kind: 'Idx58'
}

export type LookupSource_Idx59 = {
    __kind: 'Idx59'
}

export type LookupSource_Idx6 = {
    __kind: 'Idx6'
}

export type LookupSource_Idx60 = {
    __kind: 'Idx60'
}

export type LookupSource_Idx61 = {
    __kind: 'Idx61'
}

export type LookupSource_Idx62 = {
    __kind: 'Idx62'
}

export type LookupSource_Idx63 = {
    __kind: 'Idx63'
}

export type LookupSource_Idx64 = {
    __kind: 'Idx64'
}

export type LookupSource_Idx65 = {
    __kind: 'Idx65'
}

export type LookupSource_Idx66 = {
    __kind: 'Idx66'
}

export type LookupSource_Idx67 = {
    __kind: 'Idx67'
}

export type LookupSource_Idx68 = {
    __kind: 'Idx68'
}

export type LookupSource_Idx69 = {
    __kind: 'Idx69'
}

export type LookupSource_Idx7 = {
    __kind: 'Idx7'
}

export type LookupSource_Idx70 = {
    __kind: 'Idx70'
}

export type LookupSource_Idx71 = {
    __kind: 'Idx71'
}

export type LookupSource_Idx72 = {
    __kind: 'Idx72'
}

export type LookupSource_Idx73 = {
    __kind: 'Idx73'
}

export type LookupSource_Idx74 = {
    __kind: 'Idx74'
}

export type LookupSource_Idx75 = {
    __kind: 'Idx75'
}

export type LookupSource_Idx76 = {
    __kind: 'Idx76'
}

export type LookupSource_Idx77 = {
    __kind: 'Idx77'
}

export type LookupSource_Idx78 = {
    __kind: 'Idx78'
}

export type LookupSource_Idx79 = {
    __kind: 'Idx79'
}

export type LookupSource_Idx8 = {
    __kind: 'Idx8'
}

export type LookupSource_Idx80 = {
    __kind: 'Idx80'
}

export type LookupSource_Idx81 = {
    __kind: 'Idx81'
}

export type LookupSource_Idx82 = {
    __kind: 'Idx82'
}

export type LookupSource_Idx83 = {
    __kind: 'Idx83'
}

export type LookupSource_Idx84 = {
    __kind: 'Idx84'
}

export type LookupSource_Idx85 = {
    __kind: 'Idx85'
}

export type LookupSource_Idx86 = {
    __kind: 'Idx86'
}

export type LookupSource_Idx87 = {
    __kind: 'Idx87'
}

export type LookupSource_Idx88 = {
    __kind: 'Idx88'
}

export type LookupSource_Idx89 = {
    __kind: 'Idx89'
}

export type LookupSource_Idx9 = {
    __kind: 'Idx9'
}

export type LookupSource_Idx90 = {
    __kind: 'Idx90'
}

export type LookupSource_Idx91 = {
    __kind: 'Idx91'
}

export type LookupSource_Idx92 = {
    __kind: 'Idx92'
}

export type LookupSource_Idx93 = {
    __kind: 'Idx93'
}

export type LookupSource_Idx94 = {
    __kind: 'Idx94'
}

export type LookupSource_Idx95 = {
    __kind: 'Idx95'
}

export type LookupSource_Idx96 = {
    __kind: 'Idx96'
}

export type LookupSource_Idx97 = {
    __kind: 'Idx97'
}

export type LookupSource_Idx98 = {
    __kind: 'Idx98'
}

export type LookupSource_Idx99 = {
    __kind: 'Idx99'
}

export type LookupSource_IdxU16 = {
    __kind: 'IdxU16'
    value: number
}

export type LookupSource_IdxU32 = {
    __kind: 'IdxU32'
    value: number
}

export type LookupSource_IdxU64 = {
    __kind: 'IdxU64'
    value: bigint
}

export const LookupSource: sts.Type<LookupSource> = sts.closedEnum(() => {
    return {
        AccountId: AccountId,
        Idx0: sts.unit(),
        Idx1: sts.unit(),
        Idx10: sts.unit(),
        Idx100: sts.unit(),
        Idx101: sts.unit(),
        Idx102: sts.unit(),
        Idx103: sts.unit(),
        Idx104: sts.unit(),
        Idx105: sts.unit(),
        Idx106: sts.unit(),
        Idx107: sts.unit(),
        Idx108: sts.unit(),
        Idx109: sts.unit(),
        Idx11: sts.unit(),
        Idx110: sts.unit(),
        Idx111: sts.unit(),
        Idx112: sts.unit(),
        Idx113: sts.unit(),
        Idx114: sts.unit(),
        Idx115: sts.unit(),
        Idx116: sts.unit(),
        Idx117: sts.unit(),
        Idx118: sts.unit(),
        Idx119: sts.unit(),
        Idx12: sts.unit(),
        Idx120: sts.unit(),
        Idx121: sts.unit(),
        Idx122: sts.unit(),
        Idx123: sts.unit(),
        Idx124: sts.unit(),
        Idx125: sts.unit(),
        Idx126: sts.unit(),
        Idx127: sts.unit(),
        Idx128: sts.unit(),
        Idx129: sts.unit(),
        Idx13: sts.unit(),
        Idx130: sts.unit(),
        Idx131: sts.unit(),
        Idx132: sts.unit(),
        Idx133: sts.unit(),
        Idx134: sts.unit(),
        Idx135: sts.unit(),
        Idx136: sts.unit(),
        Idx137: sts.unit(),
        Idx138: sts.unit(),
        Idx139: sts.unit(),
        Idx14: sts.unit(),
        Idx140: sts.unit(),
        Idx141: sts.unit(),
        Idx142: sts.unit(),
        Idx143: sts.unit(),
        Idx144: sts.unit(),
        Idx145: sts.unit(),
        Idx146: sts.unit(),
        Idx147: sts.unit(),
        Idx148: sts.unit(),
        Idx149: sts.unit(),
        Idx15: sts.unit(),
        Idx150: sts.unit(),
        Idx151: sts.unit(),
        Idx152: sts.unit(),
        Idx153: sts.unit(),
        Idx154: sts.unit(),
        Idx155: sts.unit(),
        Idx156: sts.unit(),
        Idx157: sts.unit(),
        Idx158: sts.unit(),
        Idx159: sts.unit(),
        Idx16: sts.unit(),
        Idx160: sts.unit(),
        Idx161: sts.unit(),
        Idx162: sts.unit(),
        Idx163: sts.unit(),
        Idx164: sts.unit(),
        Idx165: sts.unit(),
        Idx166: sts.unit(),
        Idx167: sts.unit(),
        Idx168: sts.unit(),
        Idx169: sts.unit(),
        Idx17: sts.unit(),
        Idx170: sts.unit(),
        Idx171: sts.unit(),
        Idx172: sts.unit(),
        Idx173: sts.unit(),
        Idx174: sts.unit(),
        Idx175: sts.unit(),
        Idx176: sts.unit(),
        Idx177: sts.unit(),
        Idx178: sts.unit(),
        Idx179: sts.unit(),
        Idx18: sts.unit(),
        Idx180: sts.unit(),
        Idx181: sts.unit(),
        Idx182: sts.unit(),
        Idx183: sts.unit(),
        Idx184: sts.unit(),
        Idx185: sts.unit(),
        Idx186: sts.unit(),
        Idx187: sts.unit(),
        Idx188: sts.unit(),
        Idx189: sts.unit(),
        Idx19: sts.unit(),
        Idx190: sts.unit(),
        Idx191: sts.unit(),
        Idx192: sts.unit(),
        Idx193: sts.unit(),
        Idx194: sts.unit(),
        Idx195: sts.unit(),
        Idx196: sts.unit(),
        Idx197: sts.unit(),
        Idx198: sts.unit(),
        Idx199: sts.unit(),
        Idx2: sts.unit(),
        Idx20: sts.unit(),
        Idx200: sts.unit(),
        Idx201: sts.unit(),
        Idx202: sts.unit(),
        Idx203: sts.unit(),
        Idx204: sts.unit(),
        Idx205: sts.unit(),
        Idx206: sts.unit(),
        Idx207: sts.unit(),
        Idx208: sts.unit(),
        Idx209: sts.unit(),
        Idx21: sts.unit(),
        Idx210: sts.unit(),
        Idx211: sts.unit(),
        Idx212: sts.unit(),
        Idx213: sts.unit(),
        Idx214: sts.unit(),
        Idx215: sts.unit(),
        Idx216: sts.unit(),
        Idx217: sts.unit(),
        Idx218: sts.unit(),
        Idx219: sts.unit(),
        Idx22: sts.unit(),
        Idx220: sts.unit(),
        Idx221: sts.unit(),
        Idx222: sts.unit(),
        Idx223: sts.unit(),
        Idx224: sts.unit(),
        Idx225: sts.unit(),
        Idx226: sts.unit(),
        Idx227: sts.unit(),
        Idx228: sts.unit(),
        Idx229: sts.unit(),
        Idx23: sts.unit(),
        Idx230: sts.unit(),
        Idx231: sts.unit(),
        Idx232: sts.unit(),
        Idx233: sts.unit(),
        Idx234: sts.unit(),
        Idx235: sts.unit(),
        Idx236: sts.unit(),
        Idx237: sts.unit(),
        Idx238: sts.unit(),
        Idx24: sts.unit(),
        Idx25: sts.unit(),
        Idx26: sts.unit(),
        Idx27: sts.unit(),
        Idx28: sts.unit(),
        Idx29: sts.unit(),
        Idx3: sts.unit(),
        Idx30: sts.unit(),
        Idx31: sts.unit(),
        Idx32: sts.unit(),
        Idx33: sts.unit(),
        Idx34: sts.unit(),
        Idx35: sts.unit(),
        Idx36: sts.unit(),
        Idx37: sts.unit(),
        Idx38: sts.unit(),
        Idx39: sts.unit(),
        Idx4: sts.unit(),
        Idx40: sts.unit(),
        Idx41: sts.unit(),
        Idx42: sts.unit(),
        Idx43: sts.unit(),
        Idx44: sts.unit(),
        Idx45: sts.unit(),
        Idx46: sts.unit(),
        Idx47: sts.unit(),
        Idx48: sts.unit(),
        Idx49: sts.unit(),
        Idx5: sts.unit(),
        Idx50: sts.unit(),
        Idx51: sts.unit(),
        Idx52: sts.unit(),
        Idx53: sts.unit(),
        Idx54: sts.unit(),
        Idx55: sts.unit(),
        Idx56: sts.unit(),
        Idx57: sts.unit(),
        Idx58: sts.unit(),
        Idx59: sts.unit(),
        Idx6: sts.unit(),
        Idx60: sts.unit(),
        Idx61: sts.unit(),
        Idx62: sts.unit(),
        Idx63: sts.unit(),
        Idx64: sts.unit(),
        Idx65: sts.unit(),
        Idx66: sts.unit(),
        Idx67: sts.unit(),
        Idx68: sts.unit(),
        Idx69: sts.unit(),
        Idx7: sts.unit(),
        Idx70: sts.unit(),
        Idx71: sts.unit(),
        Idx72: sts.unit(),
        Idx73: sts.unit(),
        Idx74: sts.unit(),
        Idx75: sts.unit(),
        Idx76: sts.unit(),
        Idx77: sts.unit(),
        Idx78: sts.unit(),
        Idx79: sts.unit(),
        Idx8: sts.unit(),
        Idx80: sts.unit(),
        Idx81: sts.unit(),
        Idx82: sts.unit(),
        Idx83: sts.unit(),
        Idx84: sts.unit(),
        Idx85: sts.unit(),
        Idx86: sts.unit(),
        Idx87: sts.unit(),
        Idx88: sts.unit(),
        Idx89: sts.unit(),
        Idx9: sts.unit(),
        Idx90: sts.unit(),
        Idx91: sts.unit(),
        Idx92: sts.unit(),
        Idx93: sts.unit(),
        Idx94: sts.unit(),
        Idx95: sts.unit(),
        Idx96: sts.unit(),
        Idx97: sts.unit(),
        Idx98: sts.unit(),
        Idx99: sts.unit(),
        IdxU16: sts.number(),
        IdxU32: sts.number(),
        IdxU64: sts.bigint(),
    }
})

export type BalanceLock = {
    id: LockIdentifier,
    amount: Balance,
    until: BlockNumber,
    reasons: number,
}

export const BalanceLock: sts.Type<BalanceLock> = sts.struct(() => {
    return {
        id: LockIdentifier,
        amount: Balance,
        until: BlockNumber,
        reasons: sts.number(),
    }
})

export type BlockNumber = number

export const BlockNumber: sts.Type<BlockNumber> = sts.number()

export type LockIdentifier = Bytes

export const LockIdentifier: sts.Type<LockIdentifier> = sts.bytes()

export type VestingSchedule = {
    offset: Balance,
    perBlock: Balance,
    startingBlock: BlockNumber,
}

export const VestingSchedule: sts.Type<VestingSchedule> = sts.struct(() => {
    return {
        offset: Balance,
        perBlock: Balance,
        startingBlock: BlockNumber,
    }
})

export type Balance = bigint

export const Balance: sts.Type<Balance> = sts.bigint()

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()
