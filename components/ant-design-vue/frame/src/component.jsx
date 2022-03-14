import toArray from '@form-create/utils/lib/toarray';
import Mitt from '@form-create/utils/lib/mitt';
import {defineComponent, resolveComponent, nextTick} from 'vue';
import CloseCircleOutlined from './CloseCircleOutlined.vue';
import FolderOutlined from './FolderOutlined.vue';
import FileOutlined from './FileOutlined.vue';
import DeleteOutlined from './DeleteOutlined.vue';
import EyeOutlined from './EyeOutlined.vue';
import './style.css';

const NAME = 'fcFrame';

export default defineComponent({
    name: NAME,
    props: {
        type: {
            type: String,
            default: 'input'
        },
        field: String,
        helper: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        src: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: 'FolderOutlined'
        },
        width: {
            type: [Number, String],
            default: 500
        },
        height: {
            type: String,
            default: '370px'
        },
        maxLength: {
            type: Number,
            default: 0
        },
        okBtnText: {
            type: String,
            default: '确定'
        },
        closeBtnText: {
            type: String,
            default: '关闭'
        },
        modalTitle: String,
        handleIcon: {
            type: [String, Boolean],
            default: undefined
        },
        title: String,
        allowRemove: {
            type: Boolean,
            default: true
        },
        onOpen: {
            type: Function,
            default: () => {
            }
        },
        onOk: {
            type: Function,
            default: () => {
            }
        },
        onCancel: {
            type: Function,
            default: () => {
            }
        },
        onLoad: {
            type: Function,
            default: () => {
            }
        },
        onBeforeRemove: {
            type: Function,
            default: () => {
            }
        },
        onRemove: {
            type: Function,
            default: () => {
            }
        },
        onHandle: Function,
        modal: {
            type: Object,
            default: () => ({})
        },
        srcKey: [String, Number],
        modelValue: [Array, String, Number, Object],
        previewMask: undefined,
        footer: {
            type: Boolean,
            default: true
        },
        reload: {
            type: Boolean,
            default: true
        },
        closeBtn: {
            type: Boolean,
            default: true
        },
        okBtn: {
            type: Boolean,
            default: true
        },
        formCreateInject: Object,
    },
    emits: ['update:modelValue', 'change'],
    components:{
        FolderOutlined,
        EyeOutlined,
    },
    data() {
        return {
            fileList: toArray(this.modelValue),
            previewVisible: false,
            frameVisible: false,
            previewImage: '',
            bus: new Mitt()
        }
    },
    watch: {
        modelValue(n) {
            this.fileList = toArray(n);
        }
    },
    methods: {
        close() {
            this.closeModal(true);
        },
        closeModal(close) {
            this.bus.$emit(close ? '$close' : '$ok');
            if (this.reload) {
                this.bus.$off('$ok');
                this.bus.$off('$close');
            }
            this.frameVisible = false;
        },
        handleCancel() {
            this.previewVisible = false;
        },

        showModal() {
            if (this.disabled || false === this.onOpen()) {
                return;
            }
            this.frameVisible = true;
        },
        input() {
            const n = this.fileList;
            const val = this.maxLength === 1 ? (n[0] || '') : n;
            this.$emit('update:modelValue', val);
            this.$emit('change', val);
        },
        makeInput() {
            const Type = resolveComponent(this.icon);

            const slots = {
                addonAfter: () => <Type class="_fc-frame-icon" onClick={this.showModal}/>
            };

            if (this.fileList.length) {
                slots.suffix = () => <CloseCircleOutlined class="_fc-frame-icon" onClick={() => {
                    this.fileList = [];
                    this.input();
                }}/>
            }
            return <AInput readonly={true} value={(this.fileList.map(v => this.getSrc(v))).toString()}
                key={1} v-slots={slots}>
            </AInput>
        },

        makeGroup(children) {
            if (!this.maxLength || this.fileList.length < this.maxLength)
                children.push(this.makeBtn());
            return <div key={2}>{children}</div>
        },

        makeItem(index, children) {
            return <div class="_fc-files" key={'3' + index}>{children}</div>;
        },
        valid(f) {
            const field = this.formCreateInject.field || this.field;
            if (field && f !== field) {
                throw new Error('[frame]无效的字段值');
            }
        },

        makeIcons(val, index) {
            if (this.handleIcon !== false || this.allowRemove === true) {
                const icons = [];
                if ((this.type !== 'file' && this.handleIcon !== false) || (this.type === 'file' && this.handleIcon))
                    icons.push(this.makeHandleIcon(val, index));
                if (this.allowRemove)
                    icons.push(this.makeRemoveIcon(val, index));

                return <div class="_fc-upload-cover" key={4}>{icons}</div>
            }
        },
        makeHandleIcon(val, index) {
            const Type = resolveComponent((this.handleIcon === true || this.handleIcon === undefined) ? 'EyeOutlined' : this.handleIcon);
            return <Type class="_fc-frame-icon"
                onClick={() => this.handleClick(val)} key={'5' + index}/>
        },

        makeRemoveIcon(val, index) {
            return <DeleteOutlined class="_fc-frame-icon" onClick={() => this.handleRemove(val)}
                key={'6' + index}/>
        },

        makeFiles() {
            return this.makeGroup(this.fileList.map((src, index) => {
                return this.makeItem(index, [<FileOutlined class="_fc-frame-icon"
                    onClick={() => this.handleClick(src)}/>, this.makeIcons(src, index)])
            }))
        },
        makeImages() {
            return this.makeGroup(this.fileList.map((src, index) => {
                return this.makeItem(index, [<img src={this.getSrc(src)}/>, this.makeIcons(src, index)])
            }))
        },
        makeBtn() {
            const Type = resolveComponent(this.icon);
            return <div class="_fc-upload-btn" onClick={() => this.showModal()} key={7}>
                <Type class="_fc-frame-icon"/>
            </div>
        },
        handleClick(src) {
            if (this.onHandle) {
                return this.onHandle(src);
            } else {
                this.previewImage = this.getSrc(src);
                this.previewVisible = true;
            }
        },
        handleRemove(src) {
            if (this.disabled) return;
            if (false !== this.onBeforeRemove(src)) {
                this.fileList.splice(this.fileList.indexOf(src), 1);
                this.input();
                this.onRemove(src);
            }
        },
        getSrc(src) {
            return !this.srcKey ? src : src[this.srcKey];
        },
        frameLoad(iframe) {
            this.onLoad(iframe);
            try {
                if (this.helper === true) {
                    iframe['form_create_helper'] = {
                        api: this.formCreateInject.api,
                        close: (field) => {
                            this.valid(field);
                            this.closeModal();
                        },
                        set: (field, value) => {
                            this.valid(field);
                            if (!this.disabled)
                                this.$emit('update:modelValue', value);

                        },
                        get: (field) => {
                            this.valid(field);
                            return this.modelValue;
                        },
                        onOk: fn => this.bus.$on('$ok', fn),
                        onClose: fn => this.bus.$on('$close', fn)
                    };

                }
            } catch (e) {
                console.error(e);
            }
        },
        makeFooter() {
            const {okBtnText, closeBtnText, closeBtn, okBtn, footer} = this.$props;

            const node = [];
            if (!footer) return node;

            if (closeBtn)
                node.push(<AButton
                    onClick={() => (this.onCancel() !== false && this.closeModal(true))}>{closeBtnText}</AButton>);
            if (okBtn)
                node.push(<AButton type="primary"
                    onClick={() => (this.onOk() !== false && this.closeModal())}>{okBtnText}</AButton>);
            return node;
        }
    },
    render() {
        const type = this.type;
        let Node;
        if (type === 'input')
            Node = this.makeInput();
        else if (type === 'image')
            Node = this.makeImages();
        else
            Node = this.makeFiles();

        const {width = '30%', height, src, title, modalTitle} = this.$props;
        nextTick(() => {
            if (this.$refs.frame) {
                this.frameLoad(this.$refs.frame.contentWindow || {});
            }
        });
        return <div class="_fc-frame">{Node}
            <aModal mask={this.previewMask} title={modalTitle} visible={this.previewVisible}
                onCancel={() => this.previewVisible = false} footer={null}>
                <img style="width: 100%" src={this.previewImage}/>
            </aModal>
            <aModal {...{width, title, ...this.modal}} visible={this.frameVisible}
                onCancel={() => (this.closeModal(true))} v-slots={
                    {footer: () => this.makeFooter()}
                }>
                {(this.frameVisible || !this.reload) ? <iframe ref="frame" src={src} frameborder="0" style={{
                    height,
                    'border': '0 none',
                    'width': '100%'
                }}/> : null}
            </aModal>
        </div>
    },
    beforeMount() {
        const {name, field, api} = this.formCreateInject;
        name && api.on('fc:closeModal:' + name, this.close);
        field && api.on('fc:closeModal:' + field, this.close);
    },
    beforeUnmount() {
        const {name, field, api} = this.formCreateInject;
        name && api.off('fc:closeModal:' + name, this.close);
        field && api.off('fc:closeModal:' + field, this.close);
    }
})
